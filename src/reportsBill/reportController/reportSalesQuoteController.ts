import type { Request, Response } from "express";
import { connection } from "../../config/db";
import { formatCurrency, formatDate } from "../../helpers/formatData";
import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import pdfMake from "../../utils/pdfMake";

export class reportSalesQuoteController {
  // * Get sales quote by id
  static getSalesQuoteReportById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const resultDetailsSalesQuote = await connection.query(
        "SELECT p.nombre_producto, p.sac, um.unidad_medida, dcv.precio_venta, dcv.cantidad, dcv.subtotal FROM detalle_cotizacion_venta dcv INNER JOIN producto p ON p.id = dcv.id_producto inner join unidad_medida um on um.id=p.id_unidad_medida WHERE BIN_TO_UUID(dcv.id_cotizacion_venta) = ?",
        [id]
      );

      const resultSalesQuote = await connection.query(
        "SELECT BIN_TO_UUID(cv.id) AS id, LPAD(cv.numero_cotizacion, 10, '0') AS numero_cotizacion, cv.fecha_finalizacion, cv.facturacion, cv.prefacturacion, cv.dias, cv.termino, cv.observaciones, cv.impuesto_manual, cv.subtotal, cv.total, BIN_TO_UUID(c.id) AS id_cliente, LPAD(c.codigo_cliente, 10, '0') AS codigo_cliente, c.nombre_cliente, c.ruc, c.direccion_cliente, cv.fecha_creacion FROM cotizacion_venta cv INNER JOIN cliente c ON c.id = cv.id_cliente WHERE BIN_TO_UUID(cv.id) = ?;",
        [id]
      );

      const resultDataCompany = await connection.query(
        "SELECT nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo FROM empresa"
      );

      const detalles = resultDetailsSalesQuote[0];

      const {
        nombre_empresa,
        eslogan,
        direccion_empresa,
        ruc,
        telefono_empresa,
        celular_empresa,
        correo_empresa,
        logotipo
      } = resultDataCompany[0][0];

      const {
        numero_cotizacion,
        termino,
        fecha_creacion,
        fecha_finalizacion,
        facturacion,
        prefacturacion,
        dias,
        codigo_cliente,
        nombre_cliente,
        direccion_cliente,
        impuesto_manual,
        observaciones,
        total,
        subtotal,
        ruc: ruc_cliente,
      } = resultSalesQuote[0][0];

      const {
        porcentaje,
        valor_porcentaje,
        valor_cantidad
      } = impuesto_manual[0];

      
      const dateNow = new Date();      
      const text = facturacion === 1 ? "FACTURADA" : facturacion === 1 ? "PREFACTURADA" : formatDate(dateNow.toString()) > formatDate(fecha_finalizacion) ? "VENCIDA" : "";      
      const colorText = text === "FACTURADA" ? "#a2d2ff" : text === "PREFACTURADA" ? "#a2d2ff" : text === "VENCIDA" ? "#ffb3c1" : "";
      const tableBody = [
        ["Cantidad", "Producto", "SAC", "U/M", "Precio U.", "Valor"],
        ...detalles.map((item: any) => [
          { text: item.cantidad, style: "center" },
          item.nombre_producto,
          item.sac,
          item.unidad_medida,
          formatCurrency(item.precio_venta),
          formatCurrency(item.subtotal)
        ])
      ];

      const response = await fetch(logotipo);
      if (!response.ok) {
        throw new Error("No se pudo cargar la imagen");
      }
      const arrayBufferLogotipo = await response.arrayBuffer();
      const imageBufferLogotipo = Buffer.from(arrayBufferLogotipo);
      const imageLogotipo = `data:image/png;base64,${imageBufferLogotipo.toString("base64")}`;

      const docDefinition: TDocumentDefinitions = {
        header:
        {
          columns: [
            {
              image: imageLogotipo,
              width: 120,
              alignment: "left"
            },
            {
              width: '*',
              stack: [
                { text: nombre_empresa, style: "title", alignment: "right" },
                { text: eslogan, style: "small", alignment: "right" },
                { text: "RUC: " + ruc, style: "small", alignment: "right" },
                { text: direccion_empresa, style: "small", alignment: "right" },
                { text: correo_empresa, style: "small", alignment: "right" },
                { text: "Tel: " + telefono_empresa, style: "small", alignment: "right" },
                { text: "Cel: " + celular_empresa, style: "small", alignment: "right" },
              ]
            },
          ],
          margin: [20, 10, 30, 20],
          height: 200,
        },
        watermark: {
          text: text, fontSize: 60, angle: -45, color: colorText, opacity: 0.5, bold: true
        },
        content: [
          { text: "\n" },
          { text: "\n" },
          {
            columns: [
              {
                text: "PROFORMA",
                alignment: "center",
                style: "header"
              }
            ]
          },
          {
            columns: [
              {
                width: '*',
                stack: [
                  {
                    text: "C. cliente:  " + codigo_cliente, style: "info"
                  },
                  { text: "Cliente:  " + nombre_cliente, style: "info" },
                  { text: "RUC:  " + ruc_cliente, style: "info" },
                  { text: "Dirección:  " + direccion_cliente, style: "info" },
                ]
              },
              {
                width: '*',
                stack: [
                  { text: "N. Cotización:  " + numero_cotizacion, style: "rightInfoNumberBuys" },
                  { text: "Fecha Creación:  " + formatDate(fecha_creacion), style: "rightInfo" },
                  { text: "Término:  " + termino, style: "rightInfo" },
                  { text: "Fecha Vencimiento:  " + formatDate(fecha_finalizacion), style: "rightInfoNumberBuys" },
                ]
              }
            ]
          },
          { text: "\n" },
          {
            table: {
              headerRows: 1,
              widths: ["auto", "*", "auto", "auto", "auto", "auto"],
              body: tableBody
            },
            layout: "customHorizontalLines"
          },
          { text: "\n" },
          {
            columns: [
              { width: "*", text: "" },
              {
                width: "auto",
                table: {
                  widths: ["auto", "auto"],
                  body: [
                    ["Subtotal:", formatCurrency(subtotal)],
                    ["IVA:", formatCurrency(valor_cantidad)],
                    ["Total:", formatCurrency(total)]
                  ]
                },
                layout: {
                  hLineWidth: function () {
                    return 0.5;
                  },
                  vLineWidth: function () {
                    return 0.5;
                  },
                  hLineColor: function () {
                    return '#000000';
                  },
                  vLineColor: function () {
                    return '#000000';
                  },
                  paddingLeft: function () {
                    return 5;
                  },
                  paddingRight: function () {
                    return 5;
                  },
                  paddingTop: function () {
                    return 2;
                  },
                  paddingBottom: function () {
                    return 2;
                  }
                },
              }
            ]
          },
          { text: "\n" }
        ],
        footer: function (currentPage: number, pageCount: number): Content {
          return {
            stack: [
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        text: [
                          'Observaciones:',
                          { text: '\n' },
                          { text: observaciones || "Sin observaciones" }],
                        margin: 2
                      }
                    ]
                  ]
                },
                margin: [20, 0, 20, 0],
              },
              { text: "** Elaborar cheque a Nombre de: JOSE MAURICIO REYES **", style: "infoObservations", margin: [0, 2, 0, 2] },
              {
                table: {
                  widths: ["*"],
                  body: [
                    [
                      {
                        text: [
                          { text: "PROFORMA VÁLIDA POR " },
                          { text: `${dias}`, style: "textBold" },
                          { text: " DÍAS, Este documento no es una factura ni recibo de pago. Solo sirve para detallar los precios de los productos solicitados. Estos precios pueden variar sin previo aviso. La entrega de los mismos será según existencias al momento confirmada la compra." }
                        ],
                        margin: [2, 2, 2, 2]
                      }
                    ]
                  ]
                },
                margin: [20, 0, 20, 0]
              },
              { text: "\n" },
              {
                text: `Página ${currentPage} de ${pageCount}`,
                alignment: 'right',
                fontSize: 8,
                margin: [0, 0, 20, 5]
              }
            ]
          };
        },
        styles: {
          header: { fontSize: 14, bold: true },
          center: { alignment: "center", },
          title: { fontSize: 10, bold: true },
          textBold: { bold: true, color: "#13315c" },
          small: { fontSize: 8 },
          info: { fontSize: 9, lineHeight: 1.3 },
          factura: { fontSize: 9, color: "#0077b6" },
          rightInfo: { fontSize: 9, alignment: "right", lineHeight: 1.3 },
          rightInfoNumberBuys: { fontSize: 9, alignment: "right", color: "#e63946", lineHeight: 1.3 },
          subheader: { fontSize: 10, bold: true, alignment: "center", lineHeight: 1.3 },
          infoObservations: { fontSize: 10, bold: true, alignment: "center", lineHeight: 1.3 },
        },
        defaultStyle: {
          fontSize: 9,
        },
        pageSize: "LETTER",
        pageMargins: [30, 80, 30, 115]
      };

      pdfMake.tableLayouts = {
        customHorizontalLines: {
          hLineWidth: function (i, node) {
            // Línea arriba del header (i === 0), línea debajo del header (i === 1), y línea al final de la tabla
            if (i === 0 || i === 1 || i === node.table.body.length) {
              return 1;
            }
            return 0;
          },
          vLineWidth: function (i, node) {
            return 1; // Vertical lines for all columns
          },
          hLineColor: function (i, node) {
            return '#000'; // Black horizontal lines
          },
          vLineColor: function (i, node) {
            return '#000'; // Black vertical lines
          },
          paddingLeft: function (i, node) {
            return 8;
          },
          paddingRight: function (i, node) {
            return 8;
          },
          paddingTop: function (i, node) {
            return 5;
          },
          paddingBottom: function (i, node) {
            return 5;
          }
        }
      };

      const pdfDocGenerator = pdfMake.createPdf(docDefinition);

      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader("Content-Disposition", `attachment; filename = Compra-${numero_cotizacion}-${nombre_cliente}.pdf`);
        res.end(buffer);
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
