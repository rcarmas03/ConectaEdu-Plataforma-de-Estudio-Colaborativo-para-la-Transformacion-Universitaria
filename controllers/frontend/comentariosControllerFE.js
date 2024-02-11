const Comentarios = require('../../models/Comentarios');
const Meeti = require('../../models/Meetis');

exports.agregarComentario = async (req, res, next) =>{
    // obtener el comentraio
    const { comentario } = req.body;

    await Comentarios.create({
        mensaje: comentario,
        usuarioId: req.user.id,
        meetiId: req.params.id
    })

    // Redireccionar a la misma pagina
    res.redirect('back');
    next();
}

exports.eliminarComentario = async (req, res, next) =>{
     // Tomar el ID del comentario
     const { comentarioId } = req.body;

     // Consultar el Comentario
     const comentario = await Comentarios.findOne({ where : { id : comentarioId }});
 
 
     // verificar si existe el comentario
     if(!comentario) {
         res.status(404).send('Acción no válida');
         return next();
     }
 
     // consultar el Meeti del comentario
     const meeti = await Meeti.findOne({ where : { id : comentario.meetiId }});
 
     // verificiar que quien lo borra sea el creador
     if(comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id ){
         await Comentarios.destroy({ where: {
             id : comentario.id
         }});
         res.status(200).send('Eliminado Correctamente');
         return next();
     } else {
         res.status(403).send('Acción no válida');
         return next();
     }
}
