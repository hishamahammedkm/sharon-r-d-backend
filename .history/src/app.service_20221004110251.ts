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
    // console.log('file 00000', file);

    const aws: { companyName?: string } = await this.aws.getData(file.filename);

    console.log('AWSSS---', aws);

    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const username = process.env.USERNAME;
    const api_key = process.env.API_KEY;
    let sharonProducts = [];
    let companyData = {};
    let categories = ['Grocery', 'Utilities', 'Travel'];
    const file_path = file.path;

    // const file_path = './upload/invoice2.jpeg';

    let veryfi_client = new Client(client_id, client_secret, username, api_key);
    try {
      let response = await veryfi_client.process_document(
        file_path,
        (categories = categories),
      );
      // fs.writeFile('jsonData.json', JSON.stringify(response), function (err) {
      //   if (err) {
      //     console.log(err);
      //   }
      // });
      // console.log(response);
      companyData['companyName'] =
 
        aws['CompanyName'] || response.vendor.name;
      companyData['gstNumber'] = aws['gstNumber'] || response.vat_number;
      companyData['billNumber'] = aws['Bill Number'] || response.invoice_number;
      response.line_items.forEach((product) => {
        let position = product.description.search(/SHARON/i);
        if (position >= 0) {
          sharonProducts.push(product);
        }
      });
      // console.log('sharonProducts---', sharonProducts);
      return { sharonProducts, ...companyData };
    } catch (error) {
      console.log('error from varify api---', error);
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
