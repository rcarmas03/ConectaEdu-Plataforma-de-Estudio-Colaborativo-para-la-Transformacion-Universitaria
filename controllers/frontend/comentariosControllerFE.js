const Comentarios = require('../../models/Comentarios');

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
    res.send('Se elimino');
}
