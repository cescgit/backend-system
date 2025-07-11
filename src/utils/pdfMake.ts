import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// @ts-ignore: forzamos la asignación del vfs
(pdfMake as any).vfs = (pdfFonts as any).vfs;

export default pdfMake;