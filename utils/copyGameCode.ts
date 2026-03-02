export async function copyGameCode(roomCode: string) {
    try {
        await navigator.clipboard.writeText(roomCode)
    } catch (err) {
        try {
            const textarea = document.createElement("textarea")
            textarea.value = roomCode
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand("copy")
            document.body.removeChild(textarea)
        } catch {
            console.log("Error al copiar")
        }
    }
}