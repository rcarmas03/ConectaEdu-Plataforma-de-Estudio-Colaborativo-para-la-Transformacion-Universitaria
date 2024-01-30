import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () =>{
    const formsEliminar = document.querySelectorAll('.eliminar-comentario');

    // revisar que existn los formularios
    if(formsEliminar.length > 0){
        formsEliminar.forEach(form => {
            form.addEventListener('submit', eliminarComentario);
        })
    }
});

function eliminarComentario(e){
    e.preventDefault();

    axios.post(this.action)
        .then(respuesta => {
            console.log(respuesta);
        })
}