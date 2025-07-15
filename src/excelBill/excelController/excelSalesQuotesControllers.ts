import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import { connection } from "../../config/db";
import { formatDate } from "../../helpers/formatData";


export class salesQuotesControllers {
    static getSalesQuotesExcel = async (req: Request, res: Response) => {
        const { id } = req.params;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Cotización de venta");


        try {
            const resultDetailsSalesQuote = await connection.query(
                "SELECT p.nombre_producto, p.sac, dcv.precio_venta, dcv.cantidad, dcv.subtotal FROM detalle_cotizacion_venta dcv INNER JOIN producto p ON p.id = dcv.id_producto WHERE BIN_TO_UUID(dcv.id_cotizacion_venta) = ?",
                [id]
            );

            const resultSalesQuote = await connection.query(
                "SELECT BIN_TO_UUID(cv.id) AS id, LPAD(cv.numero_cotizacion, 10, '0') AS numero_cotizacion, cv.fecha_finalizacion, cv.dias, cv.termino, cv.observaciones, cv.impuesto_manual, cv.subtotal, cv.total, BIN_TO_UUID(c.id) AS id_cliente, LPAD(c.codigo_cliente, 10, '0') AS codigo_cliente, c.nombre_cliente, c.ruc, c.direccion_cliente, cv.fecha_creacion FROM cotizacion_venta cv INNER JOIN cliente c ON c.id = cv.id_cliente WHERE BIN_TO_UUID(cv.id) = ?;",
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
            } = (resultDataCompany[0] as any)[0];

            const {
                numero_cotizacion,
                termino,
                fecha_creacion,
                fecha_finalizacion,
                dias,
                codigo_cliente,
                nombre_cliente,
                direccion_cliente,
                impuesto_manual,
                observaciones,
                total,
                subtotal,
                ruc: ruc_cliente,
            } = (resultSalesQuote[0] as any)[0];

            const {
                porcentaje,
                valor_porcentaje,
                valor_cantidad
            } = impuesto_manual[0];

            worksheet.autoFilter = 'A11:E11';

            worksheet.columns = Array(7).fill({ width: 20 });

            worksheet.mergeCells("A1", "B1");
            worksheet.getCell("A1").value = `N. de proforma: ${numero_cotizacion}`;
            worksheet.getCell("A1").font = { color: { argb: "FFFF0000" }, bold: true };

            worksheet.mergeCells("D1", "E1");
            worksheet.getCell("D1").value = `Fecha: ${formatDate(fecha_creacion)}`;


            worksheet.mergeCells("A2", "E2");
            worksheet.getCell("A2").value = nombre_empresa;
            worksheet.getCell("A2").font = { size: 18, bold: true };
            worksheet.getCell("A2").alignment = { horizontal: "center" };


            worksheet.getCell("A4").value = "CODIGO DEL CLIENTE: " + codigo_cliente;            

            worksheet.getCell("A5").value = "CLIENTE: " + nombre_cliente;            

            worksheet.getCell("A6").value = "RUC: " + ruc_cliente;

            worksheet.getCell("A7").value = "DIRECCION: " + direccion_cliente;            

            worksheet.mergeCells("A9", "E9");
            worksheet.getCell("A9").value = `Fecha de vencimiento: ${formatDate(fecha_finalizacion)}`;
            worksheet.getCell("A9").font = { color: { argb: "FFFF0000" }, bold: true };

            const headers = ["PRODUCTOS", "SAC", "P. UNITARIO", "CANTIDAD", "VALOR"];
            worksheet.getRow(11).values = [, ...headers]; // empieza en B para dar espacio

            const headerRow = worksheet.getRow(11);
            headerRow.font = { bold: true };            
            headerRow.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },                    
                };                
            });

            // Fila 12-13: Datos de productos
            const productos =
                (detalles as any).map((dataDetailsSalesQuote: any) => {
                    const { nombre_producto, sac, precio_venta, cantidad, subtotal } = dataDetailsSalesQuote;
                    return [
                        nombre_producto,
                        sac,
                        +precio_venta,
                        +cantidad,
                        +subtotal
                    ]
                })

            productos.forEach((prod: any, i: number) => {
                const row = worksheet.getRow(12 + i);
                row.values = [, ...prod];
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });                
            });

            // Fila 16-18: Totales
            worksheet.getCell("D20").value = "SUBTOTAL";
            worksheet.getCell("E20").value = +subtotal;

            worksheet.getCell("D21").value = "IVA";
            worksheet.getCell("E21").value = +impuesto_manual[0].valor_cantidad;

            worksheet.getCell("D22").value = "TOTAL";
            worksheet.getCell("E22").value = +total;
            worksheet.getCell("D22").font = { bold: true };
            worksheet.getCell("E22").font = { bold: true };

            // Estilo totales
            [20, 21, 22].forEach((row) => {
                ["D", "E"].forEach((col) => {
                    worksheet.getCell(`${col}${row}`).border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadworksheetml.worksheet"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=Cotización-${numero_cotizacion}-${nombre_cliente}.xlsx`
            );

            await workbook.xlsx.write(res);
            res.send();

        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

