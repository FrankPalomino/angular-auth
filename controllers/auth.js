const { response } = require("express");
const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const { generarJWT } = require("../helpers/jwt");

const crearUsuario = async (req, res = response) => {
  const { name, email, password } = req.body;

  try {
    // Verificar Email
    let usuario = await Usuario.findOne({ email });

    if (usuario) {
      return res.status(400).json({
        ok: false,
        msg: "El Email está en uso",
      });
    }

    // Crear usuario con el modelo
    const dbUser = new Usuario(req.body);

    // Hashear la contraseña
    const salt = bcrypt.genSaltSync();
    dbUser.password = bcrypt.hashSync(password, salt);

    // Generar el JWT
    const token = await generarJWT(dbUser.id, dbUser.name, dbUser.email);

    // Crear usuario de base de datos
    await dbUser.save();

    // Generar respuesta exitosa
    return res.status(201).json({
      ok: true,
      uid: dbUser.id,
      name,
      token,
      email: dbUser.email
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      msg: "Pongase en contacto con el Administrador",
    });
  }
};

const loginUsuario = async (req, res = response) => {
  const { email, password } = req.body;

  try {
    const dbUser = await Usuario.findOne({ email });

    if (!dbUser) {
      return res.status(400).json({
        ok: false,
        msg: "El correo no existe",
      });
    }

    // Confirmar mach del password
    const validPassword = bcrypt.compareSync(password, dbUser.password);

    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        msg: "El password no es correcto",
      });
    }

    // Generar JWT
    const token = await generarJWT(dbUser.id, dbUser.name, dbUser.email);

    // Respuesta del servicio
    return res.json({
      ok: true,
      uid: dbUser.id,
      name: dbUser.name,
      token,
      email: dbUser.email
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      msg: "Pongase en contacto con el Administrador",
    });
  }
};

const revalidarToken = async (req, res = response) => {
  const { uid, name, email } = req;

  const token = await generarJWT(uid, name, email);

  return res.json({
    ok: true,
    uid,
    name,
    token,
    email
  });
};

module.exports = { crearUsuario, loginUsuario, revalidarToken };
