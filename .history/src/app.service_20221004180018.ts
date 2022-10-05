import { Injectable } from '@nestjs/common';
// import Client from '@veryfi/veryfi-sdk';
const Client = require('@veryfi/veryfi-sdk');

import fs from 'fs';
import { AwsService } from './aws/aws.service';

@Injectable()
export class AppService {
  constructor(private aws: AwsService) {}
  getHello(): string {
    return 'Hello World!';
  }
  getData = async (file) => {
   let sharonProducts = []
   const {products,} =  await this.aws.analyzeInvoice(file.filename);
   console.log("invoiceData-----",invoiceData);
  


    try {
  


      invoiceData.products.forEach((product) => {
        let position = product.name.search(/SHARON/i);
        if (position >= 0) {
          sharonProducts.push(product);
        }
      });
      return { sharonProducts, };
    } catch (error) {
      return [];
    }
  };

  processData = (data) => {
    return data.reduce((prv, cur) => {
      return prv + cur.price * cur.quantity;
    }, 0);
  };

  async processFile(file: Express.Multer.File) {
    const data = await this.getData(file);

    let totoalPurchaseAmount = 0;
    // @ts-ignore
    if (data.sharonProducts) {
      // @ts-ignore
      totoalPurchaseAmount = this.processData(data.sharonProducts).toFixed(2);
    }
    console.log(totoalPurchaseAmount);
    // console.log('data---', data);
    // @ts-expect-error
    if (data.length == 0) {
      return {
        statusCode: 404,
        message: 'some this went wrong',
      };
    }

    return { totoalPurchaseAmount, ...data };
  }
}
