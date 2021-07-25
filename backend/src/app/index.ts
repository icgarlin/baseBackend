import dmRoutes from '../modules/dm/dm.router';
import serverRoutes from '../modules/server/server.router';
import express, { Request, Response } from 'express';
import sslRedirect from 'heroku-ssl-redirect';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import stripeWebhook from '../config/stripe';
const app = express();



const corsOptions = {
   origin: (process.env.NODE_ENV === 'production') ? 'https://www.thndr.tv/' : '*',
   credentials: false
}

app.post(`/stripe-webhook`, bodyParser.raw({type: 'application/json'}), stripeWebhook)
app.use(bodyParser.json({limit: '50mb'}));
app.use(express.json({limit: '50mb'}));
app.use(`/dm`, dmRoutes);
app.use(`/server`, serverRoutes);
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'production') {
  app.use(sslRedirect());
  app.use(express.static(path.join(__dirname, '../../../frontend/build/')));
  app.get('/*', function response(req: Request, res: Response) {
    if ('https' !== req.headers['x-forwarded-proto']) {
      res.redirect('https://' + req.hostname + req.url);
    }
    const extension = path.extname(req.url);
    const name = req.url.split('/').pop();
    switch (extension) {
        case '.js':
            res.setHeader('Content-Type', 'text/javascript');
            res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/static/js' + req.url)));
            res.end();
            break;
        case '.css':
            res.setHeader('Content-Type', 'text/css');
            res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/static/css' + req.url)));
            res.end();
            break;
        case '.png':
            res.setHeader('Content-Type', 'image/png');
            res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/static/media' + req.url)));
            res.end();
            break;
        case '.jpg':
            res.setHeader('Content-Type', 'image/jpeg');
            res.write(fs.readFileSync(path.join(__dirname,'../../../frontend/build/static/media' + req.url)));
            res.end();
            break;
        default:
            if (name == 'index.html' || !extension) {
                res.setHeader('Content-Type', 'text/html');
                res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/', 'index.html')));
                res.end();
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.write(fs.readFileSync(path.join(__dirname, '../../../frontend/build/', 'manifest.json')));
            }
            return;
    }
});
} else {
  app.use(express.static(path.join(__dirname, '../../../frontend/public')));
  app.get('/*', function (req: Request, res: Response) {
    res.sendFile(path.join(__dirname, '../../../frontend/public/index.html'));
  });
}


export default app; 
