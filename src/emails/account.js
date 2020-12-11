const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const senderEmail = 'mtm12@mail.aub.edu'

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: senderEmail,
        subject: 'Welcome to Task App',
        text: `Hello, ${name}, welcome to the AUB Marketplace applicaton, lemme know how it goes`
    }).catch((e)=>{
        console.log(e)
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: senderEmail,
        subject: 'Account Successfully deleted',
        text: `Hello, ${name}, we're sorry to see you leaving. Is there anything we could have done for a better experience?`
    }).catch((e)=>{
        console.log(e)
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}