import type { Request, Response } from "express";
import { connection } from "../../config/db";
import { formatCurrency, formatDate } from "../../helpers/formatData";

export class reportPurchaseReturnController {
    // * Get purchase quotes by id
    static getPurchaseReturnReportById = async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            let i: any, end: any;

            const { PDFDocument } = require("pdfkit-table-ts");
            const doc = new PDFDocument({
                size: "Letter",
                displayTitle: true,
                lang: "es-Es",
                bufferPager: true,
                margins: {
                    top: 20,
                    bottom: 20,
                    left: 15,
                    right: 15,
                }
            });

            const fontBlack = "src/fonts/RobotoCondensed-Black.ttf";
            const fontBold = "src/fonts/RobotoCondensed-Bold.ttf";
            const fontRegular = "src/fonts/RobotoCondensed-Regular.ttf";
            const fontMedium = "src/fonts/RobotoCondensed-Medium.ttf";

            const resultDetailsBuys = await connection.query(
                "select p.nombre_producto, p.precio_compra, ddc.cantidad, ddc.subtotal from detalle_devolucion_compra ddc inner join producto p on p.id=ddc.id_producto where BIN_TO_UUID(ddc.id_devolucion_compra) = ?;",
                [id]
            );

            const resultPurchaseReturn = await connection.query(
                "select BIN_TO_UUID(dc.id) as id, dc.numero_compra, dc.numero_factura_proveedor, dc.termino, dc.observaciones, dc.subtotal, dc.total, BIN_TO_UUID(pv.id) as id_proveedor, pv.nombre_proveedor as nombre_proveedor, pv.ruc as ruc, pv.direccion_proveedor as direccion_proveedor, i.valor_cantidad, dc.fecha_creacion from devolucion_compra dc inner join proveedor pv on pv.id=dc.id_proveedor inner join impuesto i on dc.id_impuesto=i.id where BIN_TO_UUID(dc.id) = ?;",
                [id]
            );

            const resultDataCompany = await connection.query(
                "select nombre_empresa, eslogan, direccion_empresa, ruc, telefono_empresa, celular_empresa, correo_empresa, logotipo from empresa;"
            )

            for (const dataCompany of (resultDataCompany[0] as any)) {

                const {
                    nombre_empresa,
                    eslogan,
                    direccion_empresa,
                    ruc,
                    telefono_empresa,
                    celular_empresa,
                    correo_empresa,
                    logotipo,
                } = dataCompany;

                const response = await fetch(logotipo);
                if (!response.ok) {
                    throw new Error("No se pudo cargar la imagen");
                }
                const arrayBuffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);
                doc.image(imageBuffer, 10, 20, { width: 110 });

                doc
                    .fontSize(16)
                    .font(fontBlack)
                    .text(nombre_empresa, 110, 20, { align: "right" })

                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(eslogan, 110, 40, { align: "right" })

                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text("RUC: " + ruc, 110, 50, { align: "right" })

                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(direccion_empresa, 110, 60, { align: "right" })

                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(correo_empresa, 110, 70, { align: "right" })

                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text("TEL. " + telefono_empresa, 110, 82, { align: "right" })

                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text("CEL. " + celular_empresa, 110, 92, { align: "right" })
                    .moveDown();
            }

            doc
                .fontSize(20)
                .font(fontBlack)
                .text("REPORTE DEVOLUCIÓN DE COMPRA", 10, 90, { align: "center" })
                .moveDown();

            for (const dataPurchaseReturn of (resultPurchaseReturn[0] as any)) {

                const {
                    numero_factura_proveedor,
                    numero_compra,
                    termino,
                    fecha_creacion,
                    nombre_proveedor,
                    ruc,
                    direccion_proveedor,
                } = dataPurchaseReturn;

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader("Content-Disposition", `attachment; filename = Devolución Compra-${numero_compra}-${nombre_proveedor}.pdf`);

                doc
                    .fontSize(9)
                    .font(fontBold)
                    .text("Proveedor:", 18, 120, { align: "left" })
                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(nombre_proveedor, 70, 120, { align: "left" })

                doc
                    .fontSize(9)
                    .font(fontBold)
                    .text("RUC:", 18, 135, { align: "left" })
                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(ruc, 70, 135, { align: "left" })

                doc
                    .fontSize(9)
                    .font(fontBold)
                    .text("Dirección:", 18, 150, { align: "left" })
                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(direccion_proveedor, 70, 150, { align: "left" })

                doc
                    .fontSize(9)
                    .font(fontBold)
                    .text("N. Factura:", 18, 165, { align: "left" })
                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .fillColor("#c1121f")
                    .text(numero_factura_proveedor, 70, 165, { align: "left" })

                const marginRight = 190;
                const pageWidth = doc.page.width;
                const xPosition = pageWidth - marginRight

                doc
                    .fontSize(9)
                    .font(fontBold)
                    .fillColor("black")
                    .text("N. Compra:", xPosition, 120)
                doc
                    .fontSize(9)
                    .fillColor("#03045e")
                    .font(fontRegular)
                    .text(numero_compra, xPosition + 90, 120)

                doc
                    .fontSize(9)
                    .fillColor("black")
                    .font(fontBold)
                    .text("Fecha Creación:", xPosition, 135)

                doc
                    .fontSize(9)
                    .fillColor("black")
                    .font(fontRegular)
                    .text(formatDate(fecha_creacion), xPosition + 90, 135)

                doc
                    .fontSize(9)
                    .font(fontBold)
                    .text("Termino:", xPosition, 150)
                doc
                    .fontSize(9)
                    .font(fontRegular)
                    .text(termino, xPosition + 90, 150)
                    .moveDown();

                doc.lineWidth(0.5)
                doc
                    .rect(12, 113, 587, 72)
                    .stroke()
                    .moveDown();
            }


            const tableDetailsBuys = {
                headers: [
                    { label: "Producto", property: "nombre_producto", align: "center", width: 245 },
                    { label: "Precio Unitario", property: "precio_compra", align: "center", width: 120 },
                    { label: "Cantidad", property: "cantidad", align: "center", width: 100 },
                    { label: "Valor", property: "subtotal", align: "center", width: 120 },
                ],
                datas: resultDetailsBuys[0]
            };


            const optionsDetailsBuys = {
                width: 500,
                x: 13,
                y: 195,
                padding: {
                    top: 1, bottom: 1, left: 5, right: 5,
                },
            };
            await doc.table(tableDetailsBuys, optionsDetailsBuys);

            function calculateTableHeight(tableDetails: any) {
                const rowHeight = 20;  // Altura estimada por cada fila (puedes ajustarlo según el tamaño de la fuente)
                const headerHeight = 30;  // Altura de la cabecera de la tabla

                // Calcular el número de filas de datos
                const rowCount = tableDetails.datas.length;

                // El alto total de la tabla será el alto de las cabeceras más las filas
                const tableHeight = headerHeight + (rowHeight * rowCount);

                return tableHeight;
            }
            const tableHeight = calculateTableHeight(tableDetailsBuys) + 110 + 70;

            const marginRight = 190;
            const pageWidth = doc.page.width;
            const xPosition = pageWidth - marginRight

            function calculateTax(subtotal: number, tax: number) {
                return (subtotal * tax) / 100;
            }

            const resultTax = calculateTax((resultPurchaseReturn[0] as any)[0].subtotal, (resultPurchaseReturn[0] as any)[0].valor_cantidad);

            doc
                .fontSize(9)
                .font(fontBold)
                .text("Subtotal:", xPosition, tableHeight + 10)
                .fontSize(9)

            doc
                .font(fontRegular)
                .text(formatCurrency((resultPurchaseReturn[0] as any)[0].subtotal), xPosition + 60, tableHeight + 10)

            doc
                .fontSize(9)
                .font(fontBold)
                .text("Impuesto:", xPosition, tableHeight + 25)
                .fontSize(9)

            doc
                .font(fontRegular)
                .text(formatCurrency(resultTax.toString()), xPosition + 60, tableHeight + 25)

            doc
                .fontSize(9)
                .font(fontBold)
                .text("Total:", xPosition, tableHeight + 40)
                .fontSize(9)

            doc
                .font(fontRegular)
                .text(formatCurrency((resultPurchaseReturn[0] as any)[0].total), xPosition + 60, tableHeight + 40)

            doc.lineWidth(0.5)
            doc
                .rect(12, tableHeight, 587, 1)
                .stroke()
                .moveDown();

            const PageHeight = doc.page.height;
            const yPosition = PageHeight - 100;

            // const spaceDetails = doc.y + 20;

            doc
                .fontSize(9)
                .font(fontBold)
                .text("Observaciones:", 15, yPosition);

            doc
                .fontSize(9)
                .font(fontRegular)
                .text((resultPurchaseReturn[0] as any)[0].observaciones, 15, yPosition + 12);

            doc.lineWidth(0.5)
            doc
                .rect(12, yPosition - 10, 587, 70)
                .dash(5, { space: 5 })
                .stroke()
                .moveDown();

            const totalPages = doc.bufferedPageRange().count;

            const range = doc.bufferedPageRange();
            for (i = range.start, end = range.start + range.count, range.start <= end; i < end; i++) {
                doc.switchToPage(i);
                doc.text(`Página ${i + 1} de ${range.count}`, 0, 760, { align: "right" });
            }
            doc.flushPages();

            doc.pipe(res);
            doc.end();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
