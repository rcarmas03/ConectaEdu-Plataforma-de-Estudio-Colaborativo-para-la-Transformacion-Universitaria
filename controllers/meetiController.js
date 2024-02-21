const Grupos = require('../models/Grupos');
const Meeti = require('../models/Meetis');

const { v4: uuid } = require('uuid');
// Muestra el formulario para nuevos Meeti
exports.formNuevoMeeti = async (req, res) =>{
    const grupos = await Grupos.findAll({ where :{ usuarioId : req.user.id} })

    res.render('nuevo-meeti', {
        nombrePagina :  'Crear Nueva Tutoría',
        grupos
    })
}

// Inserta nuevos Meeti en la BD
exports.crearMeeti = async (req, res) =>{
    // obtener los datos
    const meeti = req.body;

    // asignar el usuario
    meeti.usuarioId = req.user.id;

    // cupo opcional
    // if(req.body.cupo == ''){
    //     meeti.cupo = 0;
    // }

    meeti.id = uuid();

    // almacenar en la BD
    try{
        await Meeti.create(meeti);
        req.flash('exito', 'Se ha creado la Tutoría Correctamente');
        res.redirect('/administracion');
    } catch(error) {
        // extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);

        req.flash('error', erroresSequelize);
        res.redirect('/nuevo-meeti');
    }
}

// sanitiza los meeti
exports.sanitizarMeeti = (req, res, next) => {
    req.sanitizeBody('titulo');
    req.sanitizeBody('url');
    req.sanitizeBody('celular');
    // req.sanitizeBody('invitado');
    // req.sanitizeBody('cupo');
    req.sanitizeBody('fecha');
    req.sanitizeBody('hora');
    req.sanitizeBody('direccion');
    req.sanitizeBody('ciudad');
    req.sanitizeBody('estado');
    req.sanitizeBody('pais');
    req.sanitizeBody('grupoId');

    next();
}

// Muestra el formulario para editar un Meeti

exports.formEditarMeeti = async (req, res, next) =>{
    const consultas = [];
    consultas.push( Grupos.findAll({ where : {usuarioId: req.user.id }}));
    consultas.push( Meeti.findByPk( req.params.id ));

    // return un promise
    const [ grupos, meeti ] = await Promise.all(consultas);

    if(!grupos || !meeti){
        req.flash('error', 'Operación no valida');
        res.redirect('/administracion');
        return next();
    }

    // mostramos la vista
    res.render('editar-meeti', {
        nombrePagina :  `Editar Tutoría : ${meeti.titulo}`,
        grupos,
        meeti
    })

}

// almacena los cambios del Meeti en la BD
exports.editarMeeti = async (req, res, next) =>{
    const meeti = await Meeti.findOne({ where: {id : req.params.id, usuarioId : req.user.id }});

    if(!meeti){
        req.flash('error', 'Operación no valida');
        res.redirect('/administracion');
        return next();
    }

    // asignar los valores

    const { grupoId, titulo, url, celular, invitado, fecha, hora, cupo, descripcion, direccion, ciudad, estado, pais} = req.body;

    meeti.grupoId = grupoId;
    meeti.titulo = titulo;
    meeti.url = url;
    meeti.celular = celular;
    meeti.fecha = fecha;
    meeti.hora = hora;
    // meeti.cupo = cupo;
    meeti.descripcion = descripcion;
    // meeti.direccion = direccion;
    // meeti.ciudad = ciudad;
    // meeti.estado = estado;
    // meeti.pais = pais;

    // almacenar en la BD
    await meeti.save();
    req.flash('exito', 'Cambios Guardados Correctamente');
    res.redirect('/administracion');
}

// muestra un formulario para eliminar meetis
exports.formEliminarMeeti = async (req, res, next) => {
    const meeti = await Meeti.findOne({ where : {id : req.params.id, usuarioId : req.user.id} });

    if(!meeti){
        req.flash('error', 'Operación no válida');
        res.redirect('/administracion');
        return next();
    }

    // mostrar la vista
    res.render('eliminar-meeti', {
        nombrePagina : `Eliminar Tutoría : ${meeti.titulo}`
    });
}

// elimina el Meeti de la BD
exports.eliminarMeeti = async (req, res) =>{
     
    await Meeti.destroy({
        where: {
            id: req.params.id
        }
    })

    req.flash('exito', 'Tutoría Eliminada');
    res.redirect('/administracion');
}