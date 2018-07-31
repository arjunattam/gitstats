import * as AWS from "aws-sdk";
import * as Handlebars from "handlebars";
import template from "./template.mjml";

export const sendEmail = (toEmail, subject, context) => {
  AWS.config.update({
    accessKeyId: process.env.SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
    region: process.env.SES_REGION
  });

  let ses = new AWS.SES();
  const hbs = Handlebars.compile(template);

  let emailParams = {
    Destination: {
      ToAddresses: [toEmail],
      BccAddresses: [process.env.SES_BCC_EMAIL]
    },
    Message: {
      Body: {
        Html: {
          Data: hbs(context)
        }
      },
      Subject: {
        Data: subject
      }
    },
    Source: process.env.SES_FROM_EMAIL
  };

  return new Promise((resolve, reject) => {
    ses.sendEmail(emailParams, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
