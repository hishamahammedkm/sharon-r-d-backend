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
  async getData(file) {
    const filePath = `${__dirname}/upload/${file}`;
    // console.log(`path from aws service--`, filePath);

    // Set the AWS Region.
    const REGION = 'us-east-1';
    // Create SNS service object.
    const textractClient = new TextractClient({ region: REGION });

    // Set params
    const params = {
      Document: {
        Bytes: fs.readFileSync(filePath),
      },
      FeatureTypes: ['TABLES', 'QUERIES'],
      QueriesConfig: {
        Queries: [
          {
            Alias: 'CompanyName',

            Text: 'what is the company name',
          },
          {
            Alias: 'Purchase amount',

            Text: 'what is the total amount of SHARON',
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

    const displayBlockInfo = async (response) => {
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

          //   console.log(`Block Type: ${block.BlockType}`);
          //   if ("Text" in block && block.Text !== undefined) {
          //     console.log(`Text: ${block.Text}`);
          //   } else {
          //   }
          //   if ("Confidence" in block && block.Confidence !== undefined) {
          //     console.log(`Confidence: ${block.Confidence}`);
          //   } else {
          //   }
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
    };
    const findRateAndQtyColumn = (obj) => {
      let keys = Object.keys(obj);
      let qtyKey;
      let rateKey;
      keys.map((key) => {
        let item = obj[key];
        let positionQty = item.search(/QTY/i);
        if (positionQty >= 0) {
          qtyKey = key;
        }
        let positionRate = item.search(/Rate/i);
        if (positionRate >= 0) {
          rateKey = key;
        }
      });
      return {
        qtyKey,
        rateKey,
      };
    };
    const getSharonProductTotalPurchaseAmount = (a) => {
      let sharonItems = [];
      let sharonItemsTotalAmount = 0;
      // console.log("table----");
      // console.log(a);
      const rows = Object.values(a[0]);
      const columnNames = rows[0];
      let qtyAndRateKey = findRateAndQtyColumn(columnNames);
      // console.log("-------qtyAndRateKey----", qtyAndRateKey);
      // console.log(columnNames);
      // console.log("-------");

      // console.log("row---", rows);
      rows.forEach((productData) => {
        let values = Object.values(productData);
        values.forEach((item) => {
          let position = item.search(/SHARON/i);
          if (position >= 0) {
            sharonItems.push(productData);
          }
        });
      });
      sharonItems.forEach((item) => {
        // console.log("itemmmm---");
        // console.log(item);
        // console.log("itemmmm---");
        let qty = parseInt(item[qtyAndRateKey.qtyKey]);
        let rate = parseFloat(item[qtyAndRateKey.rateKey]);
        // console.log("rate-", rate, "qty-", qty);
        if (typeof qty === 'number' && typeof rate === 'number') {
          sharonItemsTotalAmount += rate * qty;
        }
      });
      return sharonItemsTotalAmount.toFixed(2);
    };

    const analyze_document_text = async () => {
      try {
        const analyzeDoc = new AnalyzeDocumentCommand(params);
        const response = await textractClient.send(analyzeDoc);
        const questionAndAnswer = await displayBlockInfo(response);

        // const tables = textractHelper.createTables(response);
        // const totalPurchaseAmount = getSharonProductTotalPurchaseAmount(tables);
        const responseData = {
          ...questionAndAnswer,
        };
        return responseData;
      } catch (err) {
        console.log('Error', err);
      }
    };
    const res = await analyze_document_text();
    // console.log('data = +++++', res);
    return res;
  }

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
      FeatureTypes: ['TABLES', 'QUERIES'],
      QueriesConfig: {
        Queries: [
          {
            Alias: 'CompanyName',

            Text: 'what is the company name',
          },
          {
            Alias: 'Purchase amount',

            Text: 'what is the total amount of SHARON',
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
        const aExpense = new AnalyzeExpenseCommand(params);
        const response = await textractClient.send(aExpense);
        //console.log(response)
        response.ExpenseDocuments.forEach((doc) => {
          doc.LineItemGroups.forEach((items) => {
            items.LineItems.forEach((fields) => {
              fields.LineItemExpenseFields.forEach((expenseFields) => {
                // console.log(expenseFields);
              });
            });
          });
        });
        let resultData = [];
        response.ExpenseDocuments.forEach((exd) => {
          exd.LineItemGroups.forEach((lg) => {
            // row
            lg.LineItems.forEach((row) => {
              // colums in rows
              let product = {};
              row.LineItemExpenseFields.forEach((col) => {
                switch (col.Type.Text) {
                  case 'ITEM_NAME':
                    product

                  case 'PRICE':

                  case 'QUANTITY':

                  default:
                }
              });
              resultData.push(product);
            });
          });
        });
        fs.writeFile(
          'invoiceData.json',
          JSON.stringify(response),
          function (err) {
            if (err) {
              console.log(err);
            }
          },
        );
        console.log(
          'response from aws analyze invoice',
          response.ExpenseDocuments[0],
        );

        return response; // For unit tests.
      } catch (err) {
        console.log('Error', err);
      }
    };

    process_text_detection();
  }
}
