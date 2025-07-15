import type { Request, Response } from "express";
import { connection } from "../../config/db";
import { formatCurrency, formatDate } from "../../helpers/formatData";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import pdfMake from "../../utils/pdfMake";
import { addDays } from "date-fns";


export class reportKardexController {
    static getKardexReportById = async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const resultDetailsKardex = await connection.query(
                "select date_format(k.fecha_creacion, '%d/%m/%Y') as fecha_creacion, k.tipo,  k.cantidad_entrada, k.precio_entrada, k.total_entrada,  k.cantidad_salida, k.precio_salida, k.total_salida, k.cantidad_disponible, k.precio_disponible, k.total_disponible from kardex k inner join  producto p on p.id=k.id_producto where BIN_TO_UUID(k.id_producto) = ? order by k.fecha_creacion desc;",
                [id]
            );

            const resultProduct = await connection.query(
                "select p.codigo, p.sac, p.nombre_producto, p.imagen_url, p.fecha_expiracion, p.pesoValor, pe.peso, m.nombre_marca as marca, c.nombre_categoria as categoria from producto p inner join marca m on m.id=p.id_marca inner join categoria c on c.id=p.id_categoria inner join peso pe on pe.id=p.id_peso where BIN_TO_UUID(p.id) = ?;",
                [id]
            );

            const resultDataCompany = await connection.query(
                "select nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo from empresa;"
            )

            const {
                codigo,
                sac,
                nombre_producto,
                imagen_url,
                fecha_expiracion,
                codigo_fabricante,
                pesoValor,
                peso,
                marca,
                categoria
            } = (resultProduct[0] as any)[0];

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

            const response = await fetch(logotipo);
            if (!response.ok) {
                throw new Error("No se pudo cargar la imagen");
            }
            const arrayBufferLogotipo = await response.arrayBuffer();
            const imageBufferLogotipo = Buffer.from(arrayBufferLogotipo);
            const logotipoShop = `data:image/png;base64,${imageBufferLogotipo.toString("base64")}`;

            const responseProduct = await fetch(imagen_url);
            const arrayBufferProduct = await responseProduct.arrayBuffer();
            const imageBufferProduct = Buffer.from(arrayBufferProduct);
            const imageProduct = `data:image/png;base64,${imageBufferProduct.toString("base64")}`;

            const docDefinition: TDocumentDefinitions = {
                header:
                {
                    columns: [
                        {
                            image: logotipoShop,
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
                    {
                        columns: [
                            {
                                text: "REPORTE DE KARDEX POR PRODUCTO",
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
                                    { text: "Código:  " + codigo, style: "info" },
                                    { text: "SAC:  " + sac, style: "info" },
                                    { text: "Producto:  " + nombre_producto, style: "info" },
                                    { text: "Categoría:  " + categoria, style: "info" },
                                    { text: "Marca:  " + marca, style: "info" },
                                ]
                            },
                            {
                                width: '*',
                                stack: [
                                    { image: imageProduct, width: 50, style: "rightInfoNumberBuys" },
                                    { text: "Fecha expiracion: " + fecha_expiracion, style: "rightInfoNumberBuys" },
                                    { text: "Peso: " + pesoValor + " " + peso, style: "rightInfo" },
                                ]
                            }
                        ]
                    },
                    { text: "\n" },
                    {
                        table: {
                            headerRows: 2,
                            widths: [38, 40, 28, 38, 40, 28, 38, 40, 28, 38, 40],                            
                            body: [
                                [
                                    { text: 'Detalles', colSpan: 2, style: 'tableHeader', alignment: 'center' }, {},
                                    { text: 'Entradas', colSpan: 3, style: 'tableHeader', alignment: 'center' }, {}, {},
                                    { text: 'Salidas', colSpan: 3, style: 'tableHeader', alignment: 'center' }, {}, {},
                                    { text: 'Balance', colSpan: 3, style: 'tableHeader', alignment: 'center' }, {}, {},
                                ],
                                [
                                    { text: 'Fecha', style: "tableRows" },
                                    { text: 'Movimiento', style: "tableRows" },
                                    { text: 'Cantidad', style: "tableRows" },
                                    { text: 'Precio Ent.', style: "tableRows" },
                                    { text: 'Costo', style: "tableRows" },
                                    { text: 'Cantidad', style: "tableRows" },
                                    { text: 'Precio Sal.', style: "tableRows" },
                                    { text: 'Costo', style: "tableRows" },
                                    { text: 'Balance', style: "tableRows" },
                                    { text: 'Precio avg.', style: "tableRows" },
                                    { text: 'Total', style: "tableRows" },                                
                                ],
                                ...(resultDetailsKardex[0] as any).map((item: any) => ([
                                    { text: item.fecha_creacion, style: "tableRows" },
                                    { text: item.tipo, style: "tableRows" },
                                    { text: item.cantidad_entrada || '0', style: "tableRows" },
                                    { text: formatCurrency(item.precio_entrada) || formatCurrency('0'), style: "tableRows" },
                                    { text: formatCurrency(item.total_entrada) || formatCurrency('0'), style: "tableRows" },
                                    { text: item.cantidad_salida || '0', style: "tableRows" },
                                    { text: formatCurrency(item.precio_salida) || formatCurrency('0'), style: "tableRows" },
                                    { text: formatCurrency(item.total_salida) || formatCurrency('0'), style: "tableRows" },
                                    { text: item.cantidad_disponible || '0', style: "tableRows" },
                                    { text: formatCurrency(item.precio_disponible) || formatCurrency('0'), style: "tableRows" },
                                    { text: formatCurrency(item.total_disponible) || formatCurrency('0'), style: "tableRows" },
                                ])),
                            ]
                        },
                        layout: 'customHorizontalLines'
                    },
                    { text: "\n" }
                ],
                styles: {
                    header: { fontSize: 14, bold: true },
                    subHeader: { fontSize: 12, bold: true },
                    title: { fontSize: 10, bold: true },
                    small: { fontSize: 8 },
                    info: { fontSize: 9 },
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'black'
                    },
                    tableRows: { fontSize: 7 },
                    factura: { fontSize: 9, color: "#0077b6" },
                    rightInfo: { fontSize: 9, alignment: "right" },
                    rightInfoNumberBuys: { fontSize: 9, alignment: "right", color: "#e63946" },
                    subheader: { fontSize: 10, bold: true },
                },
                defaultStyle: {
                    fontSize: 9,
                },
                pageSize: "LETTER",
                pageMargins: [14, 100, 30, 14]
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
                res.setHeader("Content-Disposition", `attachment; filename = Kardex-${nombre_producto}.pdf`);
                res.end(buffer);
            });

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static getKardexReportByRangeDate = async (req: Request, res: Response) => {
        const { startDate, endDate } = req.params;

        try {
            const resultDetailsKardex = await connection.query(
                "SELECT p.nombre_producto, DATE_FORMAT(k.fecha_creacion, '%d/%m/%Y') AS fecha_creacion, BIN_TO_UUID(k.id) AS id, k.descripcion, k.tipo, k.cantidad_entrada, k.precio_entrada, k.total_entrada, k.cantidad_salida, k.precio_salida, k.total_salida, k.cantidad_disponible, k.precio_disponible, k.total_disponible FROM kardex k INNER JOIN producto p ON p.id = k.id_producto WHERE k.fecha_creacion BETWEEN ? AND ? ORDER BY k.fecha_creacion DESC;",
                [startDate, endDate]
            );

            const resultDataCompany = await connection.query(
                `SELECT nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, 
             celular_empresa, correo_empresa, logotipo FROM empresa;`
            );

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

            const dateStart = new Date(startDate);
            const dateEnd = new Date(endDate);

            const startDateResult = addDays(dateStart, 1);
            const endDateResult = addDays(dateEnd, 1);

            const response = await fetch(logotipo);
            if (!response.ok) {
                throw new Error("No se pudo cargar la imagen");
            }
            const arrayBufferLogotipo = await response.arrayBuffer();
            const imageBufferLogotipo = Buffer.from(arrayBufferLogotipo);
            const logotipoShop = `data:image/png;base64,${imageBufferLogotipo.toString("base64")}`;

            const docDefinition: TDocumentDefinitions = {
                header:
                {
                    columns: [
                        {
                            image: logotipoShop,
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
                    {
                        columns: [

                            {
                                width: '*',
                                stack: [
                                    {
                                        text: "REPORTE DE KARDEX",
                                        alignment: "center",
                                        style: "header"
                                    },
                                    {
                                        text: "Búsqueda por rango de fechas, desde: " + formatDate(startDateResult.toString()) + ", hasta: " + formatDate(endDateResult.toString()),
                                        alignment: "center",
                                        style: "subHeader"
                                    },
                                ]
                            }
                        ]
                    },
                    { text: "\n" },
                    {
                        table: {
                            headerRows: 2,
                            widths: [38, 38, 28, 40, 40, 28, 40, 40, 28, 40, 40],
                            body: [
                                [
                                    { text: 'Detalles', colSpan: 2, style: 'tableHeader', alignment: 'center' }, {},
                                    { text: 'Entradas', colSpan: 3, style: 'tableHeader', alignment: 'center' }, {}, {},
                                    { text: 'Salidas', colSpan: 3, style: 'tableHeader', alignment: 'center' }, {}, {},
                                    { text: 'Balance', colSpan: 3, style: 'tableHeader', alignment: 'center' }, {}, {},
                                ],
                                [
                                    { text: 'Fecha', style: "tableRows", border: [true, true, true, true] },
                                    { text: 'Movimiento', style: "tableRows" },
                                    { text: 'Cantidad', style: "tableRows" },
                                    { text: 'Precio', style: "tableRows" },
                                    { text: 'Costo', style: "tableRows" },
                                    { text: 'Cantidad', style: "tableRows" },
                                    { text: 'Precio', style: "tableRows" },
                                    { text: 'Costo', style: "tableRows" },
                                    { text: 'Balance', style: "tableRows" },
                                    { text: 'Precio', style: "tableRows" },
                                    { text: 'Total', style: "tableRows" }
                                ],
                                ...(resultDetailsKardex[0] as any).map((item: any) => ([
                                    { text: item.fecha_creacion, style: "tableRows" },
                                    { text: item.tipo, style: "tableRows" },
                                    { text: item.cantidad_entrada || '0', style: "tableRows" },
                                    { text: formatCurrency(item.precio_entrada) || formatCurrency('0'), style: "tableRows" },
                                    { text: formatCurrency(item.total_entrada) || formatCurrency('0'), style: "tableRows" },
                                    { text: item.cantidad_salida || '0', style: "tableRows" },
                                    { text: formatCurrency(item.precio_salida) || formatCurrency('0'), style: "tableRows" },
                                    { text: formatCurrency(item.total_salida) || formatCurrency('0'), style: "tableRows" },
                                    { text: item.cantidad_disponible || '0', style: "tableRows" },
                                    { text: formatCurrency(item.precio_disponible) || formatCurrency('0'), style: "tableRows" },
                                    { text: formatCurrency(item.total_disponible) || formatCurrency('0'), style: "tableRows" },
                                ])),
                            ]
                        },
                        layout: 'customHorizontalLines'
                    },
                    { text: "\n" }
                ],
                styles: {
                    header: { fontSize: 14, bold: true },
                    subHeader: { fontSize: 11, bold: true },
                    title: { fontSize: 10, bold: true },
                    small: { fontSize: 8 },
                    info: { fontSize: 9 },
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'black'
                    },
                    tableRows: { fontSize: 7 },
                    factura: { fontSize: 9, color: "#0077b6" },
                    rightInfo: { fontSize: 9, alignment: "right" },
                    rightInfoNumberBuys: { fontSize: 9, alignment: "right", color: "#e63946" },
                    subheader: { fontSize: 10, bold: true }
                },
                defaultStyle: {
                    fontSize: 9,
                },
                pageSize: "LETTER",
                pageMargins: [14, 100, 30, 14]
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
                res.setHeader("Content-Disposition", `attachment; filename = Kardex-Fecha${startDateResult}-${endDateResult}.pdf`);
                res.end(buffer);
            });

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
