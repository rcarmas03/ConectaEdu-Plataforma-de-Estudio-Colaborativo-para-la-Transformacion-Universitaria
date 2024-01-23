const Usuarios = require('../models/Usuarios');
const enviarEmail = require('../handlers/emails');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');
const { error } = require('console');
const { autenticarUsuario } = require('./authController');

const configuracionMulter = {
    limits : {filesize : 100000}, 
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/perfiles/');
        },
        filename : (req, file, next) => {
            const extension = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, next){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            // formato es valdio
            next(null, true);
        }else{
            // el formato no es valido
            next(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

// sube imagen en el servidor
exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error){
        if(error){
            console.log(error);
            if(error instanceof multer.MulterError){
                if(error.code == 'LIMIT_FIELD_SIZE'){
                    req.flash('error', 'El Archivo es muy grande')
                }else{
                    req.flash('error', error.message);
                } 
            } else if(error.hasOwnProperty('message')){
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;   
        } else {
            next();
        }
    })
}

exports.formCrearCuenta = (req, res) =>{
    res.render('crear-cuenta', {
        nombrePagina : 'Crea tu Cuenta' 
    })
}

exports.crearNuevaCuenta = async (req, res) => {
    const usuario =  req.body;

    req.checkBody('confirmar', 'El password confirmado no puede ir vacio').notEmpty();
    req.checkBody('confirmar', 'El password es diferente').equals(req.body.password);

    // Leer los errores de express
    const erroresExpress = req.validationErrors();

    //console.log(erroresExpress);

    try {
        await Usuarios.create(usuario);

        // Url de confirmacion
        const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;

        // Enviar email de confirmacion
        await enviarEmail.enviarEmail({
            usuario,
            url,
            subject : 'Confirma tu cuenta de Meeti',
            archivo : 'confirmar-cuenta',
        })

        // Flash Message y redireccionar
        req.flash('exito', 'Hemos enviado un E-mail, confirma tu cuenta');
        res.redirect('/iniciar-sesion');
    }catch(error){

        // extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);
        //console.log(erroresSequelize);
        
        // extraer solo el msg de los errores
        const errExp = erroresExpress.map(err => err.msg);

        //unirlos
        const listaErrores = [...erroresSequelize, ...errExp];

        req.flash('error', listaErrores);
        res.redirect('/crear-cuenta');
    }
}

// Confirma la suscripcion del usuario
exports.confirmarCuenta = async (req, res, next) => {
    // verificar que el usuario exista
    const usuario = await Usuarios.findOne({ where : { email: req.params.correo }});

    // si no existe, redireccionar
    if(!usuario){
        req.flash('error', 'No existe esa cuenta');
        res.redirect('/crear-cuenta');
        return next();
    }

    // si existe, confirmar suscripción y redireccionar
    usuario.activo = 1;
    await usuario.save();

    req.flash('exito', 'La cuenta se ha confirmado, ya puedes iniciar sesión');
    res.redirect('/iniciar-sesion')
}

// Formulario para iniciar sesion
exports.formIniciarSesion = (req, res) =>{
    res.render('iniciar-sesion', {
        nombrePagina : 'Iniciar Sesión' 
    })
}

// Muestra el formulario para editar el perfik
exports.formEditarPerfil = async (req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    res.render('editar-perfil', {
        nombrePagina : 'Editar perfil',
        usuario
    })
}

// Guarda los cambios del usuario en la BD
exports.editarPerfil = async (req, res) =>{
    const usuario =  await Usuarios.findByPk(req.user.id);

    req.sanitizeBody('nombre');
    req.sanitizeBody('email');
    // leer datos del form
    const { nombre, descripcion, email} = req.body;

    // asignar los valores
    usuario.nombre = nombre;
    usuario.descripcion = descripcion;
    usuario.email = email;

    // gaurdar en la BD
    await usuario.save();
    req.flash('exito', 'Cambios Guaradados Correctamente');
    res.redirect('/administracion');
}

// Muestra el formulario para modificar el password
exports.formCambiarPassword = (req, res) =>{
    res.render('cambiar-password', {
        nombrePagina: 'Cambiar Password' 
    })
}

// Revisa si el password anterior es correcto y lo modifica por uno nuevo
exports.cambiarPassword = async (req, res, next) =>{
    const usuario =  await Usuarios.findByPk(req.user.id);
    
    // verificar que el password anterior sea correcto
    if(!usuario.validarPassword(req.body.anterior)){
        req.flash('error', 'El password actual es incorrecto');
        res.redirect('/administracion');
        return next();
    };

    // si el password es correcto, hashear el nuevo
    const hash = usuario.hashPassword(req.body.nuevo);
     
    // asignar el password al usuario
    usuario.password = hash;

    // guradar en la base de datos
    await usuario.save();

    // redireccionar
    req.logout((err) => {
        if (err) {
            console.error(err);
        }
    req.flash('exito', 'Password Modificado Correctamente, vuelve a iniciar sesión');
    res.redirect('/iniciar-sesion');
    });
}

// Muestra el formulario para subir una iamgen del perfil
exports.formSubirImagenPerfil = async(req, res) =>{
    const usuario = await Usuarios.findByPk(req.user.id);

    res.render('imagen-perfil', {
        nombrePagina : 'Subir Imagen perfil',
        usuario
    });
}

// Guarda la imagen nueva, elimina la anterior ( si aplica ) y guarda el registro en la BD
exports.guardarImagenPerfil = async(req, res) =>{
    const usuario = await Usuarios.findByPk(req.user.id);
    
    // si hau imagen anterior, eliminarla
    if(req.file && usuario.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/perfiles/${usuario.imagen}`;

        // eliminar archivo con filesystem\
        fs.unlink(imagenAnteriorPath, (error) =>{
            if(error){
                console.log(error);
            }
            return;
        })
    }

    // almacena la nueva imagen
    if(req.file){
        usuario.imagen =  req.file.filename;
    }

    // almacenar en la bae de datos y redireccionar
    await usuario.save();
    req.flash('exito', 'Cambios Almacenados Correctamente');
    res.redirect('/administracion');
}