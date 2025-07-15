import type { Request, Response } from "express";
import { connection } from "../../config/db";
import { formatCurrency, formatDate } from "../../helpers/formatData";
import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import pdfMake from "../../utils/pdfMake";

export class reportRemissionsController {
    // * Get remission by id
    static getRemissionsReportById = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const resultDetailsRemissions = await connection.query(
                "select LPAD(r.codigo, 10, '0') AS codigo, p.nombre_producto, dr.cantidad, um.unidad_medida, c.nombre_cliente, c.direccion_cliente, r.fecha_creacion from remisiones r inner join detalle_remisiones dr on dr.id_remisiones=r.id inner join producto p on p.id=dr.id_producto inner join unidad_medida um on um.id=p.id_unidad_medida inner join cliente c on c.id=r.id_cliente where BIN_TO_UUID(r.id) = ?;",
                [id]
            );

            const resultDataCompany = await connection.query(
                "SELECT nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo FROM empresa"
            );

            const detalles = resultDetailsRemissions[0];

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
                nombre_cliente,
                direccion_cliente,
                codigo,
                estado,
                fecha_creacion
            } = (resultDetailsRemissions[0] as any)[0];

            const text = estado == 0 ? "ANULADA" : "";

            const tableBody = [
                ["Cantidad", "Producto", "U/M"],
                ...(detalles as any).map((item: any) => [
                    { text: item.cantidad, style: "center" },
                    item.nombre_producto,
                    item.unidad_medida
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
                    //height: 200,
                },
                watermark: {
                    text: text, fontSize: 60, angle: -45, color: "#ffb3c1", opacity: 0.5, bold: true
                },
                content: [
                    { text: "\n" },
                    { text: "\n" },
                    {
                        columns: [
                            {
                                text: "REMISIÓN DE SALIDA DE MATERIALES",
                                alignment: "center",
                                style: "header"
                            }
                        ]
                    },
                    { text: "\n" },
                    { text: "\n" },
                    {
                        columns: [
                            {
                                width: '*',
                                stack: [
                                    { text: "Cliente:  " + nombre_cliente, style: "info" },
                                    { text: "Dirección:  " + direccion_cliente, style: "info" },
                                ]
                            },
                            {
                                width: '*',
                                stack: [
                                    { text: "N. Remisión:  " + codigo, style: "rightInfoNumberBuys" },
                                    { text: "Fecha Creación:  " + formatDate(fecha_creacion), style: "rightInfo" },
                                ]
                            }
                        ]
                    },
                    { text: "\n" },
                    {
                        table: {
                            headerRows: 1,
                            widths: ["auto", "*", "auto"],
                            body: tableBody
                        },
                        layout: "customHorizontalLines"
                    },
                    { text: "\n" },
                ],
                footer: function (currentPage: number, pageCount: number): Content {
                    return {
                        stack: [
                            {
                                table: {
                                    widths: [130, 30, 130, 30, 130],
                                    body: [
                                        [
                                            {
                                                text: "ELABORADO POR", style: "textBold", border: [false, true, false, false], margin: [10, 0, 10, 0], alignment: "center"
                                            },
                                            { text: "\n", border: [false, false, false, false] },
                                            {
                                                text: "ENTREGADO POR", style: "textBold", border: [false, true, false, false], margin: [10, 0, 10, 0], alignment: "center"
                                            },
                                            { text: "\n", border: [false, false, false, false] },
                                            {
                                                text: "RECIBIDO POR", style: "textBold", border: [false, true, false, false], margin: [10, 0, 10, 0], alignment: "center"
                                            }
                                        ],
                                    ]
                                },
                                margin: [55, 0, 35, 0],
                            },
                            { text: "\n" },
                            { text: "\n" },
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
                    subheader: { fontSize: 10, bold: true, alignment: "center", lineHeight: 1.3 }
                },
                defaultStyle: {
                    fontSize: 9,
                },
                pageSize: "LETTER",
                pageMargins: [30, 80, 30, 80]
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
                res.setHeader("Content-Disposition", `attachment; filename = Remisión-${codigo}-${nombre_cliente}.pdf`);
                res.end(buffer);
            });

        } catch (error: any) {            
            res.status(500).json({ error: error.message });
        }
    }
}
