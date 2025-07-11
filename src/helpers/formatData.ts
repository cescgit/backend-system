export function formatDate(isoString: string) : string {
    const date = new Date(isoString)
    const formatter = new Intl.DateTimeFormat("es-Es", {
        year: "numeric",
        month: "numeric",
        day: "numeric"
    })
    return formatter.format(date)
}

export function formatCurrency(value: string) : string {
    return new Intl.NumberFormat("es-NI", {
        style: "currency",
        currency: "NIO"
    }).format(parseFloat(value))
}