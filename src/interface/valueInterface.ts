import { boolean, number, string } from "zod";

export interface usersInterface {
  id: string;
  nombre_usuario: string;
  cedula_usuario: string;
  celular_usuario: string;
  correo_usuario: string;
  password: string;
  oldPasswordUser: string;
  tipo_usuario: string;
  estado: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
  empresa: boolean;
  usuario: boolean;
  proveedor: boolean;
  clientes: boolean;
  inventario: boolean;
  compra: boolean;
  devolucion_compra: boolean;
  cotizacion_venta: boolean;
  producto_apartado: boolean;
  prefacturacion: boolean;
  venta: boolean;
  devolucion_venta: boolean;
  kardex: boolean;
  reportes_inventario: boolean;
  cuenta_corriente: boolean;
  cuenta_xcobrar: boolean;
  cuenta_xpagar: boolean;
  contabilidad: boolean;
  reportes: boolean;
}

export interface brandInterface {
  nombre_marca: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: Date;
}

export interface categoriesInterface {
  nombre_categoria: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: Date;
}

export interface typeSalesInterface {
  nombre_tipoventa: string;
  abreviatura: string;
  descripcion: string;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface taxesInterface {
  abreviatura: string;
  descripcion: string;
  valor_porcentaje: number;
  valor_cantidad: number;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface unitOfMeasureInterface {
  unidad_medida: string,
  abreviatura: string,
  fecha_creacion: Date,
  fecha_modificacion: Date,
  usuario_creador: string,
  usuario_modificador: string
}

export interface weightInterface {
  peso: string,
  abreviatura: string,
  fecha_creacion: Date,
  fecha_modificacion: Date,
  usuario_creador: string,
  usuario_modificador: string
}

export interface productsInterface {
  codigo: string,
  sac: string,
  nombre_producto: string,
  descripcion_producto: string,
  precio_compra: Float32Array,
  precio_venta_promedio: Float32Array,
  cantidad: number,
  cantidad_minima: number,
  imagen_url: string,
  estado: number,
  expiracion: number,
  fecha_expiracion: string,
  pesoValor: string,
  precio1: Float32Array,
  utilidad1: number,
  precio2: Float32Array,
  utilidad2: number,
  precio3: Float32Array,
  utilidad3: number,
  precio4: Float32Array,
  utilidad4: number,
  fecha_creacion: Date,
  fecha_modificacion: Date,
  id_unidad_medida: string,
  id_peso: string,
  id_marca: string,
  id_categoria: string,
  usuario_creador: string,
  usuario_modificador: string
}


export interface supplierInterface {
  nombre_proveedor: string;
  direccion_proveedor: string;
  correo_proveedor: string;
  telefono_proveedor: string;
  celular_proveedor: string;
  ruc: string;
  contacto: string;
  estado: boolean;
  termino_compra: string;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface customerInterface {
  cedula_cliente: string;
  nombre_cliente: string;
  telefono_cliente: string;
  celular_cliente: string;
  correo_cliente: string;
  direccion_cliente: string;
  ruc: string;
  contacto: string;
  estado: boolean;
  termino_venta: string;
  limite_credito: Float32Array;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface saleQuoteInterface {
  numero_cotizacion: string;
  termino: string;
  observaciones: string;
  total: Float32Array;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  cliente: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface companyInterface {
  nombre_empresa: string;
  eslogan: string;
  direccion_empresa: string;
  ruc: string;
  telefono_empresa: string;
  celular_empresa: string;
  correo_empresa: string;
  logotipo: string;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface permissionsInterface {
  empresa: boolean;
  permisos_empresa: [];
  usuario: boolean;
  permisos_usuario: [];
  proveedor: boolean;
  permisos_proveedor: [];
  cliente: boolean;
  permisos_cliente: [];
  marca: boolean;
  permisos_marca: [];
  categoria: boolean;
  permisos_categoria: [];
  producto: boolean;
  permisos_producto: [];
  inventario: boolean;
  remisiones: boolean;
  permisos_remisiones: [];
  compra: boolean;
  permisos_compra: [];
  devolucion_compra: boolean;
  permisos_devolucion_compra: [];
  cotizacion_venta: boolean;
  permisos_cotizacion_venta: [];
  producto_apartado: boolean;
  permisos_producto_apartado: [];
  prefacturacion: boolean;
  permisos_prefacturacion: [];
  venta: boolean;
  permisos_venta: [];
  devolucion_venta: boolean;
  permisos_devolucion_venta: [];
  kardex: boolean;
  reportes_inventario: boolean;
  cuenta_corriente: boolean;
  permisos_cuenta_corriente: [];
  cuenta_xcobrar: boolean;
  permisos_cuenta_xcobrar: [];
  cuenta_xpagar: boolean;
  permisos_cuenta_xpagar: [];
  contabilidad: boolean;
  permisos_contabilidad: [];
  reportes: boolean;
  id_usuario: string;
}

export interface dollarChangeInterface {
  compra: Float32Array;
  venta: Float32Array;
  fecha_modificacion: Date;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface buysInterface {
  numero_factura_proveedor: string,
  numero_compra: string;
  termino: string;
  observaciones: string;
  subtotal: Float32Array;
  total: Float32Array;
  estado: boolean;
  cuenta_por_pagar: boolean;
  id_proveedor: string;
  impuesto_manual: buysTaxManualInterface[];
  detalles_compra: buysDetailInterface[];
  fecha_creacion: string;
  fecha_vencimiento: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface buysTaxManualInterface {
  porcentaje: string
  valor_porcentaje: number;
  valor_cantidad: number;
}

export interface buysDetailInterface {
  id_producto: string;
  cantidad: number;
  precio_compra: Float32Array;
  subtotal: Float32Array;
  id_compra: string;
}

export interface purchaseReturnInterface {
  numero_factura_proveedor: string;
  numero_compra: string;
  termino: string;
  observaciones: string;
  subtotal: Float32Array;
  total: Float32Array;
  id_proveedor: string;
  id_impuesto: string;
  detalle_devolucion_compra: purchaseReturnDetailInterface[];
  detalle_devolucion_inventario: purchaseReturnDetailInterface[];
  fecha_creacion: string;
  fecha_modificacion: string;
  usuario_creador: string;
  usuario_modificador: string;
  id_compra: string;
}

export interface purchaseReturnDetailInterface {
  precio_compra: Float32Array;
  cantidad: number;
  subtotal: Float32Array;
  id_producto: string;
  id_devolucion_compra: string;
}

export interface salesQuoteInterface {
  numero_cotizacion: string;
  termino: string;
  observaciones: string;
  subtotal: Float32Array;
  total: Float32Array;
  dias: number;
  fecha_finalizacion: string;
  estado: boolean,
  prefacturacion: boolean,
  facturacion: boolean,
  fecha_creacion: string;
  fecha_modificacion: string;
  impuesto_manual: buysTaxManualInterface[];
  detalle_cotizacion_venta: salesQuoteDetailsinterface[];
  id_cliente: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface salesQuoteDetailsinterface {
  id_producto: string;
  id_inventario: string;
  precio_venta: Float32Array;
  cantidad: number;
  subtotal: Float32Array;
  id_cotizacion_venta: string;
}

export interface accountingAccountInterface {
  numero_cuenta: string;
  descripcion: string;
  nivel_cuenta: string;
  ruc: boolean;
  centro_costo: boolean;
  balance: Float32Array;
  tipo_cuenta: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface typeAccountInterface {
  nombre: string;
  descripcion: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface auxiliaryBookInterface {
  codigo: string;
  descripcion: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface accountingSourceInterface {
  codigo: string;
  descripcion: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface supplierBalanceInerface {
  descripcion: string;
  numero_compra: string;
  factura_proveedor: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  debito: Float32Array;
  credito: Float32Array;
  balance: Float32Array;
  estado: number;
  descripcion_anulacion: string;
  id_balance_proveedor: string;
  usuario_creador: string;
  id_proveedor: string;
}

export interface customerBalanceInerface {
  descripcion: string;
  numero_venta: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  debito: Float32Array;
  credito: Float32Array;
  balance: Float32Array;
  estado: number;
  descripcion_anulacion: string;
  id_balance_cliente: string;
  usuario_creador: string;
  id_cliente: string;
}

export interface remissionDetailsInterface {
  cantidad: number;
  id_producto: string;
  id_inventario: string;
  id_remisiones: string;
}

export interface remissionInterface {
  codigo: string;
  detalle_remision: remissionDetailsInterface[];
  fecha_creacion: string;
  fecha_modificacion: string;
  id_cliente: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface salesInterface {
  numero_venta: string;
  termino: string;
  observaciones: string;
  subtotal: Float32Array;
  total: Float32Array;
  estado: boolean;
  cuenta_por_cobrar: boolean;
  id_cliente: string;
  impuesto_manual: buysTaxManualInterface[];
  detalles_venta: salesDetailInterface[];
  fecha_vencimiento: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface salesDetailInterface {
  id_producto: string;
  id_inventario: string;
  cantidad: number;
  precio_venta: Float32Array;
  subtotal: Float32Array;
  id_venta: string;
}

export interface separatedProductInterface {
  numero_apartado: string;
  termino: string;
  observaciones: string;
  subtotal: Float32Array;
  total: Float32Array;
  estado: boolean,
  prefacturacion: boolean,
  facturacion: boolean,
  fecha_creacion: string;
  fecha_modificacion: string;
  impuesto_manual: buysTaxManualInterface[];
  detalle_producto_apartado: separatedProductDetailsinterface[];
  id_cliente: string;
  usuario_creador: string;
  usuario_modificador: string;
}

export interface separatedProductDetailsinterface {
  id_producto: string;
  id_inventario: string;
  precio_venta: Float32Array;
  cantidad: number;
  subtotal: Float32Array;
  id_cotizacion_venta: string;
}

export interface preInvoicingInterface {
  numero_prefacturacion: string,
  termino: string,
  observaciones: string,
  subtotal: Float32Array,
  total: Float32Array,
  estado: boolean,
  impuesto_manual: buysTaxManualInterface[],
  fecha_creacion: string,
  fecha_modificacion: string,
  cuenta_por_cobrar: boolean,
  cliente_existente: number,
  cliente_manual: manualClientInterface[],
  detalles_prefacturacion: preInvoincingDetailsInterface[],
  fecha_vencimiento: string,
  id_cliente: string,
  usuario_creador: string,
  usuario_modificador: string
}

export interface manualClientInterface {
  id: string,
  nombre_cliente: string,
}

export interface preInvoincingDetailsInterface {
  precio_venta: Float32Array,
  cantidad: number,
  subtotal: Float32Array,
  fecha_creacion: string,
  fecha_modificacion: string,
  id_inventario: string,
  id_producto: string,
  id_prefacturacion: string,
}