const passport = require('passport');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect : '/administracion',
    failureRedirect : '/iniciar-sesion',
    failureFlash : true,
    badRequestMessage : 'Ambos campos son obligatorios',
});

// revisa si el usuario esta autenticado o no
exports.usuarioAutenticado = (req, res, next) => {
    // si el usuario esta autenticado, adelnate
    if(req.isAuthenticated() ){
        return next();
    }

    // si no esta autenticado
    return res.redirect('/iniciar-sesion');
}
