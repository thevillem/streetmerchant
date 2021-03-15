import {Link, Store} from './store/model';
import {config} from './config';
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const prettyJson = winston.format.printf(info => {
  const timestamp = new Date().toLocaleTimeString();

  let out = `${`[${timestamp}]`} ${info.level} ${info.message}`;

  if (Object.keys(info.metadata).length > 0) {
    out = `${out} ${JSON.stringify(info.metadata, null, 2)}`;
  }

  return out;
});

const aws_log_stream = new Date().toISOString().split('T')[0];

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.uncolorize(),
    winston.format.metadata({
      fillExcept: ['level', 'message', 'timestamp'],
    }),
    prettyJson
  ),
  level: config.logLevel,
  transports: [
    new WinstonCloudWatch({
      logGroupName: `${config.aws.logGroupName}`,
      logStreamName: `${aws_log_stream}`,
      awsRegion: `${config.aws.awsRegion}`
    })
  ],
});

export const Print = {
  backoff(
    link: Link,
    store: Store,
    parameters: {delay: number; statusCode: number}
  ): string {
    return `${buildProductString(link, store)} BACKOFF DELAY status=${
      parameters.statusCode
    } delay=${parameters.delay}`;
  },
  badStatusCode(
    link: Link,
    store: Store,
    statusCode: number,
  ): string {
    return `${buildProductString(
      link,
      store
    )} STATUS CODE ERROR ${statusCode}`;
  },
  bannedSeller(link: Link, store: Store): string {
    return `${buildProductString(link, store)} BANNED SELLER`;
  },
  captcha(link: Link, store: Store): string {
    return `${buildProductString(link, store)} CAPTCHA`;
  },
  cloudflare(link: Link, store: Store): string {
    return `${buildProductString(link, store)} CLOUDFLARE, WAITING`;
  },
  inStock(link: Link, store: Store, sms?: boolean): string {
    const productString = `${buildProductString(link, store)} IN STOCK`;

    if (sms) {
      return productString;
    }

    return `${productString}`;
  },
  inStockWaiting(link: Link, store: Store): string {

    return `${buildProductString(link, store)} IN STOCK, WAITING`;
  },
  maxPrice(
    link: Link,
    store: Store,
    maxPrice: number
  ): string {
    return `${buildProductString(link, store)} PRICE ${link.price} EXCEEDS LIMIT ${maxPrice}`;
  },
  message(
    message: string,
    topic: string,
    store: Store
  ): string {
    return `${buildSetupString(topic, store)} ${message}`;
  },
  noResponse(link: Link, store: Store): string {
    return `${buildProductString(link, store)} NO RESPONSE`;
  },
  outOfStock(link: Link, store: Store): string {
    return `${buildProductString(link, store)} OUT OF STOCK`;
  },
  productInStock(link: Link): string {
    let productString = `Product Page: ${link.url}`;
    if (link.cartUrl) productString += `\nAdd To Cart Link: ${link.cartUrl}`;

    return productString;
  },
  rateLimit(link: Link, store: Store): string {
    return `${buildProductString(link, store)} RATE LIMIT EXCEEDED`;
  },
  recursionLimit(link: Link, store: Store): string {
    return `${buildProductString(link, store)} CLOUDFLARE RETRY LIMIT REACHED, ABORT`;
  },
};

function buildSetupString(
  topic: string,
  store: Store,
): string {
  return `[${store.name}] [setup (${topic})]`;
}

function buildProductString(link: Link, store: Store): string {
  if (store.currentProxyIndex !== undefined && store.proxyList) {
    const proxy = `${store.currentProxyIndex + 1}/${store.proxyList.length}`;
    return `[${proxy}] [${store.name}] [${link.brand} (${link.series})] ${link.model}`;
  } else {
    return `[${store.name}] [${link.brand} (${link.series})] ${link.model}`;
  }
}
