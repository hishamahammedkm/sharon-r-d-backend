import { Injectable } from '@nestjs/common';
// Import required AWS SDK clients and commands for Node.js
import {
  AnalyzeDocumentCommand,
  AnalyzeExpenseCommand,
} from '@aws-sdk/client-textract';
import { TextractClient } from '@aws-sdk/client-textract';
import { textractHelper } from 'aws-textract-helper';
import * as fs from 'fs';
@Injectable()
export class AwsService {
  async getData(sss){
    return {companyName:"jjh"}
  }
  // async getData(file) {
  //   const filePath = `${__dirname}/upload/${file}`;
  //   // console.log(`path from aws service--`, filePath);

  //   // Set the AWS Region.
  //   const REGION = 'us-east-1';
  //   // Create SNS service object.
  //   const textractClient = new TextractClient({ region: REGION });

  //   // Set params
  //   const params = {
  //     Document: {
  //       Bytes: fs.readFileSync(filePath),
  //     },
  //     FeatureTypes: ['TABLES', 'QUERIES'],
  //     QueriesConfig: {
  //       Queries: [
  //         {
  //           Alias: 'CompanyName',

  //           Text: 'what is the company name',
  //         },
  //         {
  //           Alias: 'Purchase amount',

  //           Text: 'what is the total amount of SHARON',
  //         },
  //         {
  //           Alias: 'Bill Number',

  //           Text: 'what is invoice number',
  //         },

  //         {
  //           Alias: 'gstNumber',
  //           Text: 'what is the gst number',
  //         },
  //       ],
  //     },
  //   };

  //   const findRateAndQtyColumn = (obj) => {
  //     let keys = Object.keys(obj);
  //     let qtyKey;
  //     let rateKey;
  //     keys.map((key) => {
  //       let item = obj[key];
  //       let positionQty = item.search(/QTY/i);
  //       if (positionQty >= 0) {
  //         qtyKey = key;
  //       }
  //       let positionRate = item.search(/Rate/i);
  //       if (positionRate >= 0) {
  //         rateKey = key;
  //       }
  //     });
  //     return {
  //       qtyKey,
  //       rateKey,
  //     };
  //   };
  //   const getSharonProductTotalPurchaseAmount = (a) => {
  //     let sharonItems = [];
  //     let sharonItemsTotalAmount = 0;
  //     // console.log("table----");
  //     // console.log(a);
  //     const rows = Object.values(a[0]);
  //     const columnNames = rows[0];
  //     let qtyAndRateKey = findRateAndQtyColumn(columnNames);
  //     // console.log("-------qtyAndRateKey----", qtyAndRateKey);
  //     // console.log(columnNames);
  //     // console.log("-------");

  //     // console.log("row---", rows);
  //     rows.forEach((productData) => {
  //       let values = Object.values(productData);
  //       values.forEach((item) => {
  //         let position = item.search(/SHARON/i);
  //         if (position >= 0) {
  //           sharonItems.push(productData);
  //         }
  //       });
  //     });
  //     sharonItems.forEach((item) => {
  //       // console.log("itemmmm---");
  //       // console.log(item);
  //       // console.log("itemmmm---");
  //       let qty = parseInt(item[qtyAndRateKey.qtyKey]);
  //       let rate = parseFloat(item[qtyAndRateKey.rateKey]);
  //       // console.log("rate-", rate, "qty-", qty);
  //       if (typeof qty === 'number' && typeof rate === 'number') {
  //         sharonItemsTotalAmount += rate * qty;
  //       }
  //     });
  //     return sharonItemsTotalAmount.toFixed(2);
  //   };

  //   const analyze_document_text = async () => {
  //     try {
  //       const analyzeDoc = new AnalyzeDocumentCommand(params);
  //       const response = await textractClient.send(analyzeDoc);
  //       const questionAndAnswer = await displayBlockInfo(response);

  //       // const tables = textractHelper.createTables(response);
  //       // const totalPurchaseAmount = getSharonProductTotalPurchaseAmount(tables);
  //       const responseData = {
  //         ...questionAndAnswer,
  //       };
  //       return responseData;
  //     } catch (err) {
  //       console.log('Error', err);
  //     }
  //   };
  //   const res = await analyze_document_text();
  //   // console.log('data = +++++', res);
  //   return res;
  // }

  async analyzeInvoice(file: string) {
    const filePath = `${__dirname}/upload/${file}`;

    // Set the AWS Region.
    const REGION = 'us-east-1';
    // Create SNS service object.
    const textractClient = new TextractClient({ region: REGION });

    // const bucket = 'bucket';
    // const photo = 'photo';

    // Set params
    // const params = {
    //   Document: {
    //     S3Object: {
    //       Bucket: bucket,
    //       Name: photo,
    //     },
    //   },
    // };
    const params = {
      Document: {
        Bytes: fs.readFileSync(filePath),
      },
      FeatureTypes: ['QUERIES'],
      QueriesConfig: {
        Queries: [
          {
            Alias: 'CompanyName',

            Text: 'what is the company name',
          },

          {
            Alias: 'Bill Number',

            Text: 'what is invoice number',
          },

          {
            Alias: 'gstNumber',
            Text: 'what is the gst number',
          },
        ],
      },
    };

    const process_text_detection = async () => {
      try {
        const analyzeDoc = new AnalyzeDocumentCommand(params);
        const responseDoc = await textractClient.send(analyzeDoc);
        const questionAndAnswer = await this.displayBlockInfo(responseDoc);
        

        const aExpense = new AnalyzeExpenseCommand(params);
        const response = await textractClient.send(aExpense);
        console.log('response from first----', response);

        let resultData = [];
        let invoiceData = {};
        response.ExpenseDocuments.forEach((exd) => {
          exd.LineItemGroups.forEach((lg) => {
            // row
            lg.LineItems.forEach((row) => {
              // colums in rows
              let product = {};
              row.LineItemExpenseFields.forEach((col) => {
                switch (col.Type.Text) {
                  case 'ITEM':
                    product['name'] = col.ValueDetection.Text;
                    break;

                  case 'PRICE':
                    product['price'] = col.ValueDetection.Text;
                    break;

                  case 'QUANTITY':
                    product['quantity'] = col.ValueDetection.Text;
                    break;

                  default:
                }
              });
              resultData.push(product);
            });
          });
        });
        console.log('resultData -------', resultData);

        response.ExpenseDocuments.forEach((exd) => {
          exd.SummaryFields.forEach((summary) => {
            switch (summary.Type.Text) {
              case 'VENDOR_NAME':
                invoiceData['vendorName'] = summary.ValueDetection.Text;

                break;
              case 'INVOICE_RECEIPT_ID':
                invoiceData['invoiceNumber'] = summary.ValueDetection.Text;
                break;

              case 'TAX_PAYER_ID':
                invoiceData['gstNumber'] = summary.ValueDetection.Text;
                break;

              default:
                break;
            }
            // if(!invoiceData['gstNumber']){
            //   // summary.LabelDetection.Text ===
            //   let position = summary.LabelDetection.Text.search(/GST/i);
            //   if (position >= 0) {
            //     invoiceData['gstNumber'] = summary.ValueDetection.Text;
            //   }
            // }
            // summary.Type.
          });
        });
        console.log('invoiceData--', invoiceData);

        fs.writeFile(
          'invoiceData.json',
          JSON.stringify(response),
          function (err) {
            if (err) {
              console.log(err);
            }
          },
        );
        // console.log(
        //   'response from aws analyze invoice',
        //   response.ExpenseDocuments[0],
        // );

        return response; // For unit tests.
      } catch (err) {
        console.log('Error', err);
      }
      return {
        ...qu
      }
      
    };

  return  process_text_detection();
  }

  async displayBlockInfo(response) {
    let questions = [];
    let answers = [];
    let questionAndAnswers = {};
    try {
      response.Blocks.forEach((block) => {
        if (block.BlockType === 'QUERY') {
          if ('Relationships' in block && block.Relationships !== undefined) {
            let answer = {
              question: block.Query.Alias,
              answerBolckId: block.Relationships[0].Ids[0],
            };
            questions.push(answer);
          }
        }
        if (block.BlockType === 'QUERY_RESULT') {
          answers.push({
            id: block.Id,
            text: block.Text,
          });
        }
      });

      questions.map((q) => {
        answers.map((ans) => {
          if (q.answerBolckId === ans.id) {
            questionAndAnswers[q.question] = ans.text;
          }
        });
      });
    } catch (err) {
      console.log('Error', err);
    }
    return questionAndAnswers;
  }
}
