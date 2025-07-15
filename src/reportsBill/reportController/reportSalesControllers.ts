import type { Request, Response } from "express";
import { connection } from "../../config/db";
import { formatCurrency, formatDate } from "../../helpers/formatData";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import pdfMake from "../../utils/pdfMake";
import { numeroALetrasCordobas } from "../../helpers/convertNumberInText";


export class reportSalesController {
  static getSalesReportById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {

      let fechaVencimiento = "";

      const resultDetailsSales = await connection.query(
        "select BIN_TO_UUID(dv.id_producto) as id_producto, p.codigo, p.nombre_producto, dv.precio_venta, dv.cantidad, dv.subtotal, um.abreviatura from detalle_venta dv inner join producto p on p.id=dv.id_producto inner join unidad_medida um on um.id=p.id_unidad_medida where BIN_TO_UUID(dv.id_venta) = ?;",
        [id]
      );

      const resultSales = await connection.query(
        "select BIN_TO_UUID(v.id) as id, LPAD(v.numero_venta, 5, '0') AS numero_venta, v.termino, v.observaciones, v.cuenta_por_cobrar, v.impuesto_manual, v.subtotal, v.total, BIN_TO_UUID(cl.id) as id_cliente, LPAD(cl.codigo_cliente, 5, '0') AS codigo_cliente, cl.nombre_cliente, cl.ruc as ruc_cliente, cl.direccion_cliente, cl.celular_cliente, v.fecha_creacion from venta v inner join cliente cl on cl.id=v.id_cliente left join usuario uc on uc.id=v.usuario_creador WHERE BIN_TO_UUID(v.id) = ?",
        [id]
      );

      const detalles = resultDetailsSales[0];

      const {
        numero_venta,
        termino,
        observaciones,
        cuenta_por_cobrar,
        impuesto_manual,
        subtotal,
        total,
        codigo_cliente,
        nombre_cliente,
        ruc_cliente,
        direccion_cliente,
        celular_cliente,
        fecha_creacion
      } = (resultSales[0] as any)[0];

      const {
        porcentaje,
        valor_porcentaje,
        valor_cantidad
      } = impuesto_manual[0];

      if (cuenta_por_cobrar === 1) {
        const getDateEnd = await connection.query(
          "select bc.fecha_vencimiento from balance_cliente bc inner join venta v on v.id=bc.id_venta where v.id = UUID_TO_BIN(?);",
          [id]
        );

        const [{ fecha_vencimiento }] = (getDateEnd[0] as any)[0];
        fechaVencimiento = formatDate(fecha_vencimiento);
      }


      // const tableBody = [
      //   ...detalles.map((item: any) => [
      //     { text: item.codigo, margin: [0, 0, 0, 0], style: "left" },
      //     { text: item.cantidad, style: "center" },
      //     { text: item.abreviatura, style: "center", margin: [0, 0, 0, 0] },
      //     { text: item.nombre_producto, style: "left", margin: [0, 0, 0, 0] },
      //     { text: formatCurrency(item.precio_venta), style: "center", margin: [0, 0, 0, 0] },
      //     { text: "---", style: "white" },
      //     { text: formatCurrency(item.subtotal), style: "center", margin: [0, 0, 0, 0] }
      //   ])
      // ];

      // 2. Mapea los objetos a un array de filas (RowData)
      const rows: (string | number)[][] = (detalles as any).map((p: any) => [
        p.codigo,
        p.cantidad,
        p.abreviatura,
        p.nombre_producto,
        formatCurrency(p.precio_venta),
        "",
        formatCurrency(p.subtotal)
      ]);

      function buildSafeFixedHeightTable(
        data: (string | number | null | undefined)[][],
        totalRows: number,
        columnWidths: (string | number)[]
      ) {
        const numCols = columnWidths.length;
        const safeBody = data.map(row =>
          new Array(numCols).fill('').map((_, i) => row[i] != null ? String(row[i]) : ''),          
        );
        while (safeBody.length < totalRows) {
          safeBody.push(new Array(numCols).fill(''));
        }
        return {
          table: { widths: columnWidths, body: safeBody },
          layout: "noBorders"
        };
      }

      const docDefinition: TDocumentDefinitions = {
        header:
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: numero_venta, style: "title", alignment: "right" },
                { text: "X", alignment: "right", style: cuenta_por_cobrar === 1 ? "positionCredit" : "positionCounted" }
              ],
            },
          ],
          margin: [20, 70, 72, 10],
         // height: 400,
        },
        content: [
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: codigo_cliente + "    " + nombre_cliente, style: "infoLeftCustomer" },
                  { text: ruc_cliente == "" ? "---" : ruc_cliente, style: ruc_cliente == "" ? "infoLeftCustomerEmpty" : "infoLeftCustomer" },
                  { text: direccion_cliente == "" ? "---" : direccion_cliente, style: direccion_cliente == "" ? "infoLeftCustomerEmpty" : "infoLeftCustomer" },
                  { text: celular_cliente, style: "infoLeftCustomerPhone" },
                ]
              },
              {
                width: '*',
                stack: [
                  { text: formatDate(fecha_creacion), alignment: "center", style: "infoRightDate", margin: [0, 10, 30, 0] },
                  { text: "\n" },
                  { text: cuenta_por_cobrar === 1 ? fechaVencimiento : "---",  margin: [0, 10, 30, 0], style: cuenta_por_cobrar == 1 ? "infoRightDate" : "infoRightDateEmpty" },
                ]
              }
            ],
            margin: [0, 0, 0, 30]
          },
          // {
          //   table: {
          //     widths: [50, 5, 20, 270, 45, 15, 65],
          //     body: tableBody,
          //   },
          //   layout: "noBorders",
          //   margin: [10, 30, 18, 280],
          //   fontSize: 8,
          // },
          {
            // margin: [0, 0, 15, 0],
            ...buildSafeFixedHeightTable(
              rows,
              50,              
              [55, 30, 50, 240, 65, 15, 65]
            )
          },
          {
            columns: [
              { width: "*", text: "" },
              { text: numeroALetrasCordobas(total), alignment: "left", style: "textBold", margin: [8, 15, 60, 0], width: 480 },
              {
                width: "auto",
                table: {
                  body: [
                    [{ text: formatCurrency(subtotal), lineHeight: 1.5, margin: [0, 0, 50, 0], alignment: "center", }],
                    [{ text: "----", lineHeight: 1.5, style: "white", margin: [0, 0, 50, 0], alignment: "center", }],
                    [{ text: formatCurrency(valor_cantidad), lineHeight: 1.5, margin: [0, 0, 50, 0], alignment: "center", }],
                    [{ text: formatCurrency(total), lineHeight: 1.5, margin: [0, 0, 50, 0], alignment: "center", }]
                  ],
                },
                layout: "noBorders",
              }
            ]
          },
          { text: "Observasiones: " + observaciones, alignment: "left", style: "textBold", margin: [8, -45, 60, 0] },          
          { text: "\n" },
          { text: "\n" },
          { text: "\n" },
          { text: "\n" },
          { text: "\n" },
          { text: "\n" },
          {
            columns: [
              { text: nombre_cliente, alignment: "left", width: 150, style: "small", margin: [90, 0, 0, 0] },
              { text: nombre_cliente, alignment: "right", width: 150, style: "small", margin: [0, 0, 0, 0] },
            ]
          },
          { text: formatDate(fecha_creacion), alignment: "left", style: "small", margin: [95, 0, 0, 0] },
          {
            columns: [
              { text: formatCurrency(total), alignment: "left", style: "small", margin: [65, 0, 0, 0] },
              { text: "2.5%", alignment: "right", style: "small", margin: [0, 0, 20, 0] }
            ]
          }
        ],

        // footer: function (currentPage: number, pageCount: number): Content {
        //   return {
        //     stack: [
        //       {
        //         table: {
        //           widths: ["*"],
        //           body: [
        //             [
        //               {
        //                 text: [
        //                   'Observaciones:',
        //                   { text: '\n' },
        //                   { text: observaciones || "Sin observaciones" }],
        //                 margin: 2
        //               }
        //             ]
        //           ]
        //         },
        //         margin: [20, 0, 20, 0],
        //       },
        //       { text: "** Elaborar cheque a Nombre de: JOSE MAURICIO REYES **", style: "infoObservations", margin: [0, 2, 0, 2] },
        //       {
        //         table: {
        //           widths: ["*"],
        //           body: [
        //             [
        //               {
        //                 text: [
        //                   { text: "PROFORMA VÁLIDA POR " },
        //                   { text: `${dias}`, style: "textBold" },
        //                   { text: " DÍAS, Este documento no es una factura ni recibo de pago. Solo sirve para detallar los precios de los productos solicitados. Estos precios pueden variar sin previo aviso. La entrega de los mismos será según existencias al momento confirmada la compra." }
        //                 ],
        //                 margin: [2, 2, 2, 2]
        //               }
        //             ]
        //           ]
        //         },
        //         margin: [20, 0, 20, 0]
        //       },
        //       { text: "\n" },
        //       {
        //         text: `Página ${currentPage} de ${pageCount}`,
        //         alignment: 'right',
        //         fontSize: 8,
        //         margin: [0, 0, 20, 5]
        //       }
        //     ]
        //   };
        // },
        styles: {
          center: { alignment: "center", },
          left: { alignment: "left", },
          title: { fontSize: 11, bold: true },
          infoLeftCustomer: { margin: [72, -2, 5, 0], fontSize: 9, lineHeight: 1.7 },
          infoLeftCustomerEmpty: { margin: [76, 0, 5, 0], fontSize: 9, lineHeight: 1.7, color: "#ffffff" },
          infoLeftCustomerPhone: { margin: [275, 4, 5, 0], fontSize: 9 },
          infoRightDate: { margin: [0, 10, 30, 0], fontSize: 9 },
          infoRightDateEmpty: { margin: [0, 10, 30, 0], fontSize: 9, lineHeight: 1.6, color: "#ffffff" },
          textBold: { bold: true },
          small: { fontSize: 8 },
          factura: { fontSize: 9, color: "#0077b6" },
          rightInfo: { fontSize: 9, alignment: "right", lineHeight: 1.3 },
          rightInfoNumberBuys: { fontSize: 9, alignment: "right", color: "#e63946", lineHeight: 1.3 },
          subheader: { fontSize: 10, bold: true, alignment: "center", lineHeight: 1.3 },
          infoObservations: { fontSize: 10, bold: true, alignment: "center", lineHeight: 1.3 },
          positionCredit: { margin: [10, 15, 20, 10], fontSize: 9 },
          positionCounted: { margin: [10, 15, 40, 10], fontSize: 9 },
          white: { color: "#fff" }
        },
        defaultStyle: {
          fontSize: 9,
        },
        pageSize: "LETTER",
        pageMargins: [30, 120, 30, 115]
      };
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);

      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader("Content-Disposition", `attachment; filename = factura-${numero_venta}-${nombre_cliente}.pdf`);
        res.end(buffer);
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
