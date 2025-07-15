import type { Request, Response } from "express";
import { connection } from "../../config/db";
import { formatCurrency, formatDate } from "../../helpers/formatData";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import pdfMake from "../../utils/pdfMake";


export class reportBuysController {
  static getBuysReportById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const resultDetailsBuys = await connection.query(
        "SELECT p.nombre_producto, p.precio_compra, dc.cantidad, dc.subtotal FROM detalle_compra dc INNER JOIN producto p ON p.id = dc.id_producto WHERE BIN_TO_UUID(dc.id_compra) = ?",
        [id]
      );

      const resultBuys = await connection.query(
        "SELECT BIN_TO_UUID(c.id) AS id, LPAD(c.numero_compra, 10, '0') AS numero_compra, c.numero_factura_proveedor, c.termino, c.observaciones, c.impuesto_manual, c.subtotal, c.total, BIN_TO_UUID(pv.id) AS id_proveedor, pv.nombre_proveedor, pv.ruc, pv.direccion_proveedor, c.fecha_creacion FROM compra c INNER JOIN proveedor pv ON pv.id = c.id_proveedor WHERE BIN_TO_UUID(c.id) = ?",
        [id]
      );

      const resultDataCompany = await connection.query(
        `SELECT nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa,
                celular_empresa, correo_empresa, logotipo
         FROM empresa`
      );

      const detalles = resultDetailsBuys[0];

      const {
        nombre_empresa,
        eslogan,
        direccion_empresa,
        ruc,
        telefono_empresa,
        celular_empresa,
        correo_empresa,
        logotipo
      } = (resultDataCompany[0] as any)[0];

      const {
        numero_factura_proveedor,
        numero_compra,
        termino,
        fecha_creacion,
        nombre_proveedor,
        direccion_proveedor,
        impuesto_manual,
        observaciones,
        total,
        subtotal,
        ruc: ruc_prov,
      } = (resultBuys[0] as any)[0];

      const {
        porcentaje,
        valor_porcentaje,
        valor_cantidad
      } = impuesto_manual[0];

      const tableBody = [
        ["Cantidad", "Producto", "Precio U.", "Valor"],
        ...(detalles as any).map((item: any) => [
          { text: item.cantidad, style: "center" },
          item.nombre_producto,
          formatCurrency(item.precio_compra),
          formatCurrency(item.subtotal)
        ]),
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
          margin: [20, 20, 20, 20],
          //height: 150
        },
        footer: function (currentPage: number, pageCount: number) {
          return {
            columns: [
              { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right' }
            ],
            margin: [20, 0, 20, 0]
          }

        },
        content: [
          { text: "\n" },
          { text: "\n" },
          {
            columns: [
              {
                text: "REPORTE DE COMPRA",
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
                  { text: "Proveedor: " + nombre_proveedor, style: "info" },
                  { text: "RUC: " + ruc_prov, style: "info" },
                  { text: "Dirección: " + direccion_proveedor, style: "info" },
                  { text: "N. Factura: " + numero_factura_proveedor, style: "factura" },
                ]
              },
              {
                width: '*',
                stack: [
                  { text: "N. Compra: " + numero_compra, style: "rightInfoNumberBuys" },
                  { text: "Fecha Creación: " + formatDate(fecha_creacion), style: "rightInfo" },
                  { text: "Término: " + termino, style: "rightInfo" }
                ]
              }
            ]
          },
          { text: "\n" },
          {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "auto", "auto"],
              body: tableBody
            },
            layout: 'customHorizontalLines',
          },
          { text: "\n" },
          {
            columns: [
              { width: "*", text: "" },
              {
                width: "auto",
                table: {
                  body: [
                    ["Subtotal:", formatCurrency(subtotal)],
                    ["IVA:", formatCurrency(valor_cantidad)],
                    ["Total:", formatCurrency(total)]
                  ]
                },
                layout: "lightHorizontalLines"
              }
            ]
          },
          { text: "\n" },
          { text: "Observaciones:", style: "subheader" },
          { text: observaciones || "Sin observaciones", style: "info" }
        ],
        styles: {
          header: { fontSize: 14, bold: true },
          title: { fontSize: 10, bold: true },
          small: { fontSize: 8 },
          info: { fontSize: 9 },
          factura: { fontSize: 9, color: "#0077b6" },
          rightInfo: { fontSize: 9, alignment: "right" },
          rightInfoNumberBuys: { fontSize: 10, alignment: "right", color: "#e63946" },
          subheader: { fontSize: 10, bold: true },
          center: { alignment: "center", },
        },
        defaultStyle: {
          fontSize: 9,
        },
        pageSize: "LETTER",
        pageMargins: [30, 100, 30, 30]
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
        res.setHeader("Content-Disposition", `attachment; filename = Compra-${numero_compra}-${nombre_proveedor}.pdf`);
        res.end(buffer);
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
