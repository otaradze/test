'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
  storageBucket: `${process.env.GCLOUD_PROJECT}.appspot.com`
});
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const api = express();
const dateFormat = require('dateformat');
// const bodyParser = require('body-parser');
/**
* Crypto
* Encrypt
* Decrypt
*/
const crypto = require('crypto');
const ENCRYPTION_KEY = `${functions.config().encr.aes128key}`;
const IV_LENGTH = `${functions.config().encr.aes128length}`;
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes128', ENCRYPTION_KEY, IV_LENGTH);
  var encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
function decrypt(text) {
  const decipher = crypto.createDecipheriv('aes128', ENCRYPTION_KEY, IV_LENGTH);
  var decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
/**
* Rest
* Api
* As a function
*/

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
  !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
    'Make sure you authorize your request by providing the following HTTP header:',
    'Authorization: Bearer <Firebase ID Token>',
    'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

api.use(cors);
api.use(cookieParser);
// api.use(bodyParser.urlencoded({extended: true}));
api.use(validateFirebaseIdToken);

api.get('/hello', (req, res) => {
  res.send(`Hello ${req.user.name}`);
});

// api.post('/verify-purchase', (req, res) => {
//   const decryptedData = decrypt(req.body.token);
//
//   const tokens = decryptedData.split(/\|/g);
//
//   const date = dateFormat('yyyy-mm-dd');
//
//   const paymentsCollection = db.collection('paymentsTransactions').doc(date).collection('PaymentGatewayProviderID');
//
//   paymentsCollection.doc(tokens[2]).get()
//   .then(doc => {
//     const mealData = doc.data();
//
//     if (mealData.isPickedUp) {
//       return res.json({ status: 'ALREADY_PICKED_UP', mealLetter: tokens[0], pickupTime: mealData.pickupTime.toDate() });
//     }
//
//     return paymentsCollection.doc(doc.id).update({ isPickedUp: true, pickupTime: new Date() })
//     .then(() => {
//       return res.json({ status: 'OK', mealLetter: tokens[0] });
//     });
//
//   })
//   .catch(err => {
//     console.log(err);
//     return res.json({ status: 'NOT_EXISTING' });
//   });
//
// });

exports.api = functions.https.onRequest(api);

/**
* Create
* Telegram
* Bot
*/
const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const bot = new Telegraf(`${functions.config().tgraf.botid}`);
/**
* Configure
* Tgraf
* Bot
*/
const thook = express();
const tpath = `${functions.config().tgraf.patid}`;
thook.use(`/${tpath}`, async (req, res) => {
  let updates = req.body;
  console.log(updates);

  if (!Array.isArray(updates)) {
    updates = [updates];
  }

  try {
    await bot.handleUpdates(updates, res)
    !res.finished && res.end();
  } catch (e) {
    res.writeHead(500);
    return res.end();
  }
});
exports.thook = functions.https.onRequest(thook);
bot.telegram.setWebhook(`https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/thook/${tpath}`);
/**
* Create DB
* Bot
* Functions
*/
var db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

const providerData = {'name': 'WeLunch Srls @ Stripe SSL Payment Gateway'};
const descriptionSSL = '\n 🔒 Payment transactions are through Stripe SSL gateway only via encrypted PGP keys via HTTPS and HSTS.';

const amministratoreBotList = {
  amministratoreBot: {
    466524766: 'alemens'
  }
};

function isAdminBot(id) {
  return id in amministratoreBotList.amministratoreBot;
}

const products = [
  {
    letter: 'A',
    name: 'pasta e lenticchie 🌱',
    price: 3.00,
    photoUrl: 'https://i.imgur.com/yhRnlXB.jpg'
  },
  {
    letter: 'B',
    name: 'pasta pomodoro fresco 🌱',
    price: 3.00,
    photoUrl: 'https://i.imgur.com/AhUJhnW.jpg'
  },
  {
    letter: 'C',
    name: 'pasta con broccoli 🐷🥛',
    price: 3.00,
    photoUrl: 'https://i.imgur.com/XGIDwPt.jpg'
  },
  {
    letter: 'D',
    name: 'spiedino di carne con patate',
    price: 4.00,
    photoUrl: 'https://i.imgur.com/ZaatO4J.jpg'
  },
  {
    letter: 'E',
    name: 'insalatona 🥛',
    price: 5.00,
    photoUrl: 'https://i.imgur.com/aTaF9Fp.jpg'
  },
  {
    letter: 'F',
    name: 'macedonia di frutta 250gr',
    price: 3.00,
    photoUrl: 'https://i.imgur.com/LT3pTMO.jpg'
  }
];

function createInvoice(product) {
  return {
    provider_token: `${functions.config().tgraf.payid}`,
    start_parameter: 'mariposa2018',
    title: `${product.letter} - ${product.name}`,
    description: `${descriptionSSL}`,
    currency: 'EUR',
    photo_url: product.photoUrl,
    photo_width: 320,
    photo_height: 320,
    is_flexible: false,
    need_shipping_address: false,
    prices: [{label: `${product.letter} - ${product.name}`, amount: Math.trunc(product.price * 100)}],
    provider_data: JSON.stringify(providerData),
    payload: `${product.letter} - ${product.name}`
  };
}

// DEBUG photo
bot.on('photo', (ctx) => {
  if (isAdmin(ctx.from.id)) {
    return console.log(ctx), console.log(ctx.message);
  } else {
    return console.log('You should be an adminBot');
  }
});

bot.hears(/db/, async (ctx) => {

  const settings = {/* your settings... */ timestampsInSnapshots: true};
  db.settings(settings);

  let dailyMenuReference = db.collection('dailyMenu');
  
  try {
    const snapshot = await dailyMenuReference.where('isAvailable', '==', true).get();
    return ctx.reply(snapshot.join('\n'));
  } catch (err) {
    console.error('Error getting documents', err);
  }
});

bot.hears(/count/, async (ctx) => {

  if (isAdminBot(ctx.from.id)) {
    const dateFormat = require('dateformat');
    const date = dateFormat('yyyy-mm-dd');

    try {
      const snapshot = await sdb.collection('paymentsTransactions').doc(date).collection('PaymentGatewayProviderID').get()

      let countObj = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
      snapshot.forEach(product => {
        const productLetter = product.data().productID.charAt(0);
        if (!(productLetter in countObj)) {
          countObj[productLetter] = 1;
        } else {
          countObj[productLetter]++;
        }
      });

      return ctx.reply(
        Object.keys(countObj).map((k) => `(${k}) ${countObj[k]}\n`).join('') +
        `Totale ordini: ${snapshot.size}`
      );      
    } catch (err) {
      console.error('Error getting documents', err);
    }

  } else {
    ctx.reply('Sorry, you don\'t have permissions to use this!');
  }
});

// Emoji command
bot.command('EmojiMeanings', ({replyWithMarkdown}) =>
replyWithMarkdown(
  '*Emoji Meanings:*\n' +
  '🌱 for vegetarians\n' +
  '🐷 contains pork\n' +
  '🥛 may contain milk derivatives'
)
);

// Payments transactions info command
bot.command('PaySafe', ({replyWithMarkdown}) =>
replyWithMarkdown(
  '*Security on payments:*\n' +
  '🔒 Payment transactions are through Stripe SSL gateway only via encrypted PGP keys via HTTPS and HSTS.\n\n' +
  '_WeLunch Srls or no-one else can access to this. Details here:_\nhttps://stripe.com/docs/security/stripe\n\n' +
  'If you turn on 2-step verification for your Telegram account. You can save payments methods and only you will quickly access to it.\n' +
  '(https://telegram.org/faq#q-how-does-2-step-verification-work)',
  Extra.webPreview(false)
)
);

// Help command
bot.command('Help', ({reply}) => reply('For help or just any other question you can chat with the admins at:\nhttps://t.me/WeLunchADA'));

// // Menu command && hears
bot.hears(/start|\/start|\/menu|^men[uù-ʉ].*/i, (ctx) => {
  return console.log(ctx), ctx.replyWithPhoto('AgADBAADkK0xG-pTWFJrSiloFIBawhs8uhoABE8uXQ_9VdQD088DAAEC',
  Extra.load({ caption:
    '_Free delivery Daily Menu:_\n\n'+
    '🕚 *Order 11 AM to 12 PM and pay digital.*\n' +
    '🕐 *Pickup 1 PM to 1:30 PM at Welcome Desk.*\n\n'+
    `${ products.reduce((acc, p) => acc += `${p.letter}-${p.name} €${p.price}\n`, '') }\n` +
    '/EmojiMeanings /PaySafe /Help\n\n' +
    '_Just Choose a letter:_'
  })
  .markdown()
  .markup((m) =>
  m.inlineKeyboard([
    m.callbackButton('A', 'aID'),
    m.callbackButton('B', 'bID'),
    m.callbackButton('C', 'cID'),
    m.callbackButton('D', 'dID'),
    m.callbackButton('E', 'eID'),
    m.callbackButton('F', 'fID')
  ])
)
);
});

bot.action('aID',  (ctx) => { ctx.answerCbQuery(), ctx.replyWithInvoice(createInvoice(products[0])); });
bot.action('bID',  (ctx) => { ctx.answerCbQuery(), ctx.replyWithInvoice(createInvoice(products[1])); });
bot.action('cID',  (ctx) => { ctx.answerCbQuery(), ctx.replyWithInvoice(createInvoice(products[2])); });
bot.action('dID',  (ctx) => { ctx.answerCbQuery(), ctx.replyWithInvoice(createInvoice(products[3])); });
bot.action('eID',  (ctx) => { ctx.answerCbQuery(), ctx.replyWithInvoice(createInvoice(products[4])); });
bot.action('fID',  (ctx) => { ctx.answerCbQuery(), ctx.replyWithInvoice(createInvoice(products[5])); });

// Order
products.forEach(p => {
  bot.hears(`${p.letter} - ${p.name}`, (ctx) => {
    ctx.replyWithInvoice(createInvoice(p));
  });
});

// Handle payment callbacks
bot.on('pre_checkout_query', ({answerPreCheckoutQuery}) => answerPreCheckoutQuery(true));
bot.on('successful_payment', (ctx) => {

  const dateFormat = require('dateformat');
  const QRCode = require('qrcode');

  let paymentRef = ctx.message.successful_payment.provider_payment_charge_id;
  let pTitle = ctx.message.successful_payment.invoice_payload;

  let mealLetter = pTitle.charAt(0);
  let mealName = pTitle.substring(4);

  let paymentCurrency = ctx.message.successful_payment.currency;
  let totalAmount = ctx.message.successful_payment.total_amount / 100;
  let firstName = ctx.from.first_name;
  let tUser = ctx.from.username;
  let tUserID = ctx.from.id;

  // Data to save
  let orderRefStringify = JSON.stringify({mealLetter, tUserID, paymentRef}, null, '\t');

  let date = dateFormat(new Date(), 'yyyy-mm-dd');

  let fileName = dateFormat(date) + '.json';

  var docReference = db.collection('paymentsTransactions').doc(date).collection('PaymentGatewayProviderID').doc(paymentRef);

  docReference.set({
    productID: pTitle,
    isPickedUp: false,
    userID: tUserID,
    providerID: 'Mariposa'
  });

  // Data to encrypt
  let orderRefToEncrypt = mealLetter + '|' + tUserID + '|' + paymentRef;

  let paymentRefEncrypted = encrypt(orderRefToEncrypt);

  console.log(`${dateFormat('isoDateTime')}, ID ${tUserID}, ${paymentRef}, ${mealLetter} - ${mealName} ${paymentCurrency} ${totalAmount}`);
  console.log(`PaymentID Encrypted: ${paymentRefEncrypted}`);
  console.log(`PaymentID Decrypted: ${decrypt(paymentRefEncrypted)}`);

  QRCode.toDataURL(paymentRefEncrypted, {
    color: {dark: '#333', light: '#FFF'},
    width: 500
  }, (err, url) => {
    if (err) {
      console.error(err);
      return;
    }

    var encodedImage = url.replace('data:image/png;base64,', '');
    var imgBuf = Buffer.from(encodedImage, 'base64');

    ctx.replyWithPhoto({source: imgBuf},
      {
        caption:
        `Thanks ${tUser} you paid ${paymentCurrency} ${totalAmount}\n for ${mealLetter} - ${mealName}\n` +
        'Pick-up at \'welcome desk\' start 1 PM and end 1:30 PM.\nPlease show this QR-Code to delivery guy strictly in this timeframe.'
      });
    });

  });
