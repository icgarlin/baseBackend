import express, { Request, Response } from 'express';
import sslRedirect from 'heroku-ssl-redirect';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet'; 
import stripeWebhook from '../config/stripe';
import compression from 'compression'; 
const app = express();



const corsOptions = {
   origin: (process.env.NODE_ENV === 'production') ? 'https://www.rainbase.io' : '*',
   credentials: false
}

app.use(compression()); 
app.use(helmet());
app.post(`/stripe-webhook`, bodyParser.raw({type: 'application/json'}), stripeWebhook)
app.use(bodyParser.json({limit: '50mb'}));
app.use(express.json({limit: '50mb'}));
// app.use('/static', express.static('public'))
app.use(cors(corsOptions));


if (process.env.NODE_ENV === 'production') {
  app.use(sslRedirect());
  app.use(express.static(path.join(__dirname, '../../../frontend/build/')));
  app.get('/', (req: Request, res: Response) => {
    res.send('Hello World')
  }); 
  app.get('/*', function response(req: Request, res: Response) {
    if ('https' !== req.headers['x-forwarded-proto']) {
      res.redirect('https://' + req.hostname + req.url);
    }
    const extension = path.extname(req.url);
    const name = req.url.split('/').pop();
    switch (extension) {
        case '.js':
            res.setHeader('Content-Type', 'text/javascript');
            // res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/static/js' + req.url)));
            res.write(fs.readFileSync(path.join(__dirname, '/static/js' + req.url)));
            res.end();
            break;
        case '.css':
            res.setHeader('Content-Type', 'text/css');
            // res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/static/css' + req.url)));
            res.write(fs.readFileSync(path.join(__dirname, '/static/css' + req.url)));
            res.end();
            break;
        case '.png':
            res.setHeader('Content-Type', 'image/png');
            // res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/static/media' + req.url)));
            res.write(fs.readFileSync(path.join(__dirname, '/static/media' + req.url)));
            res.end();
            break;
        case '.jpg':
            res.setHeader('Content-Type', 'image/jpeg');
            // res.write(fs.readFileSync(path.join(__dirname,'../../../frontend/build/static/media' + req.url)));
            res.write(fs.readFileSync(path.join(__dirname, '/static/media' + req.url)));
            res.end();
            break;
        default:
            if (name == 'index.html' || !extension) {
                res.setHeader('Content-Type', 'text/html');
                // res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/', 'index.html')));
                res.write(fs.readFileSync(path.join(__dirname, 'index.html')));
                res.end();
            } else {
                res.setHeader('Content-Type', 'application/json');
                // res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/', 'manifest.json')));
                res.write(fs.readFileSync(path.join(__dirname, 'manifest.json')));
            }
            return;
    }
  });
} else {
  // app.use(express.static(path.join(__dirname, '../../../../rainbaseWebFull/Rainbase/baseApp/frontend/public')));
  // app.use(express.static(path.join(__dirname, '../../../frontend/public')));

  app.get('/*', function (req: Request, res: Response) {
    // res.sendFile(path.join(__dirname, '../../../frontend/public/index.html'));
    // res.sendFile(path.join(__dirname, '../../../../rainbaseWebFull/Rainbase/baseApp/frontend/public/index.html'));
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}


export default app; 
