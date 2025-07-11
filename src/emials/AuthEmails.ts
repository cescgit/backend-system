import { transport } from "../config/nodemailer";
import { deviceInformation, IEmail } from "../interface/emailInterface";


export class AuthEmail {
  static sendConfirmationEmail = async (user: IEmail) => {
    const infoEmail = await transport.sendMail({
      form: "Accounting system <admin@accountingsystem.com>",
      to: user.emailUser,
      subject: "Accounting system - Confirma tu cuenta",
      text: "Accounting system - Confirma tu cuenta",
      html: `
            <style>
                 @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

                 .font-primary {
                    font-family: "Nunito", sans-serif;
                 }
                .message {
                    background-color: #96cdf1; 
                    height: 8rem; 
                    color: black; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;                    
                }
                .text-message {
                    font-size: 1.4rem;
                    margin: .5rem;
                }
                .flex-about {
                    display: flex;
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center
                }
                .flex-about img {
                    width: 16rem;
                    height: auto;
                }
                .text-user {
                    font-size: 1.4rem;
                }
                .text-user span {
                    color: #14213d; 
                }
                .paragraph {
                    font-size: 1rem
                }
                .confirm-button {
                    width: 16rem;
                    text-align: center; 
                    text-decoration: none; 
                    background-color: #96cdf1;                    
                    color: black;
                    padding: 1rem;
                    border-radius: .8rem;
                }
                .important {
                    color: #c1121f;
                }
            </style>

            <div>
                <div class="message">
                    <h2 
                        class="text-message font-primary">
                        Bienvenido a Accounting system.
                    </h2>
                </div>

                <div class="flex-about">
                    <img 
                        src="https://i.ibb.co/yfJzHkb/celebration-email.webp" alt="Imagen Celebracion"
                    >

                    <h3 class="text-user font-primary">
                        Hola: <span>${user.nameUser}</span>, confirmación de tu cuenta.
                    </h3>

                     <p class="paragraph font-primary">
                       Ya casí esta todo listo solo debes de confirmar tu cuenta.
                       <br />
                       Visita el siguiente enlace:
                    </p>

                    <a style="font-weight: 700;" href="${process.env.FRONTEND_URL}/auth/confirm-account" 
                        class="confirm-button font-primary">
                        Confirmar cuenta
                    </a>
                    
                    <p class="paragraph font-primary">
                       E ingrese el código de confirmación: <b>${user.tokenUSer}</b>
                    </p>
                     <p class="paragraph font-primary">
                       <span class="important">NOTA IMPORTANTE: </span> Este token expira en 10 minutos.
                    </p>
                </div>
            </div>
          `,
    });    
  };

  static sendPasswordResetToken = async (user: IEmail) => {
    const infoEmail = await transport.sendMail({
      form: "Accounting system <admin@accountingsystem.com>",
      to: user.emailUser,
      subject: "Accounting system - Confirma tu cuenta",
      text: "Accounting system - Confirma tu cuenta",
      html: `
            <style>
                 @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

                 .font-primary {
                    font-family: "Nunito", sans-serif;
                 }
                .message {
                    background-color: #96cdf1; 
                    height: 8rem; 
                    color: black; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;                    
                }
                .text-message {
                    font-size: 1.4rem;
                    margin: .5rem;
                }
                .flex-about {
                    display: flex;
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center
                }
                .flex-about img {
                    width: 16rem;
                    height: auto;
                }
                .text-user {
                    font-size: 1.4rem;
                }
                .text-user span {
                    color: #14213d; 
                }
                .paragraph {
                    font-size: 1rem
                }
                .confirm-button {
                    width: 16rem;
                    text-align: center; 
                    text-decoration: none; 
                    background-color: #96cdf1;                    
                    color: black;
                    padding: 1rem;
                    text-transform: uppercase;
                    border-radius: .8rem;
                }
                .important {
                    color: #c1121f;
                }
            </style>

            <div>
                <div class="message">
                    <h2 
                        class="text-message font-primary">
                        Reestablece tu password de Accounting system.
                    </h2>
                </div>

                <div class="flex-about">
                    <img 
                        src="https://i.ibb.co/hW2J328/Forgot-password-amico.webp" alt="Imagen Celebracion"
                    >

                    <h3 class="text-user font-primary">
                        Hola: <span>${user.nameUser}</span>, has solicitado reestablecer tu contraseña.
                    </h3>

                     <p class="paragraph font-primary">
                       Ya casí esta todo listo solo debes de visita el siguiente enlace:
                    </p>

                    <a style="font-weight: 700;" href="${process.env.FRONTEND_URL}/auth/new-password" 
                        class="confirm-button font-primary">
                        Reestablecer contraseña
                    </a>
                    
                    <p class="paragraph font-primary">
                       E ingrese el código de confirmación: <b>${user.tokenUSer}</b>
                    </p>
                     <p class="paragraph font-primary">
                       <span class="important">NOTA IMPORTANTE: </span> Este token expira en 10 minutos.
                    </p>
                </div>
            </div>
          `,
    });    
  };

    static sendLogin = async ({user, login}: {user: IEmail, login: deviceInformation}) => {
    const infoEmail = await transport.sendMail({
      form: "Accounting system <admin@accountingsystem.com>",
      to: user.emailUser,
      subject: "Accounting system - Inicio de sesión",
      text: "Accounting system - Inicio de sesión",
      html: `
            <style>
                 @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

                 .font-primary {
                    font-family: "Nunito", sans-serif;
                 }
                .message {
                    background-color: #96cdf1; 
                    height: 8rem; 
                    color: black; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;                    
                }
                .text-message {
                    font-size: 1.4rem;
                    margin: .5rem;
                }
                .flex-about {
                    display: flex;
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center
                }
                .flex-about img {
                    width: 16rem;
                    height: auto;
                }
                .text-user {
                    font-size: 1.4rem;
                }
                .text-user span {
                    color: #14213d; 
                }
                .paragraph {
                    font-size: 1rem
                }
                .confirm-button {
                    width: 16rem;
                    text-align: center; 
                    text-decoration: none; 
                    background-color: #96cdf1;                    
                    color: black;
                    padding: 1rem;
                    text-transform: uppercase;
                    border-radius: .8rem;
                }
                .important {
                    color: #c1121f;
                }
            </style>

            <div>
                <div class="message">
                    <h2 
                        class="text-message font-primary">
                        Se ha iniciado sesión en tu cuenta..
                    </h2>
                </div>

                <div class="flex-about">
                    <img 
                        src="https://i.ibb.co/3m5nxnVG/Login-cuate.png" alt="Imagen Celebracion"
                    >

                    <h3 class="text-user font-primary">
                        Hola: <span>${user.nameUser}</span>, si tu no has iniciado sesión en este dispositivo.
                    </h3>

                     <p class="paragraph font-primary">
                       Navegador: <strong>${login.navegador}</strong>
                    </p>

                     <p class="paragraph font-primary">
                       Sistema operativo: <strong>${login.sistema_operativo}</strong>
                    </p>

                     <p class="paragraph font-primary">
                     Dispositivo: <strong>${login.tipo_dispositivo}</strong>                       
                    </p>

                     <p class="paragraph font-primary">
                       ${login.user_agent}
                    </p>

                     <p class="paragraph font-primary">
                       Visita el siguiente enlace y cierra todas la sesiones abiertas:
                    </p>

                    <a style="font-weight: 700;" href="${process.env.FRONTEND_URL}/auth/closet-sessions" 
                        class="confirm-button font-primary">
                        Ir a cerrar sesión
                    </a>  
                    
                    <p class="paragraph font-primary">
                       Si tu has iniciado sesión, solo ignora este correo...
                    </p>
                </div>
            </div>
          `,
    });    
  };
}