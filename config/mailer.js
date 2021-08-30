const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');

 async function sendEmail(to,subject,body){

    let options = {
        auth: {
          api_key: process.env.SENDGRID_KEY
        }
      }

      let transporter = nodemailer.createTransport(sgTransport(options));
      
      let mailOptions = {
        from: process.env.FROM_ADDRESS,
        to: to,
        subject: subject,
        text: body
      };
      
     return transporter.sendMail(mailOptions);

}

module.exports = sendEmail;