// Prints an HTML document through a hidden iframe — no new tab/window.
// The browser's print dialog then lets the user "Enregistrer en PDF".
export function printHtml(html) {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
        position: 'fixed', right: '0', bottom: '0',
        width: '0', height: '0', border: '0', visibility: 'hidden',
    });
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    const trigger = () => {
        win.focus();
        win.print();
        // Remove after the dialog closes (afterprint) or as a fallback timeout.
        win.onafterprint = () => iframe.remove();
        setTimeout(() => { if (document.body.contains(iframe)) iframe.remove(); }, 60000);
    };

    // Give the doc a tick to lay out before printing.
    if (doc.readyState === 'complete') setTimeout(trigger, 250);
    else win.onload = () => setTimeout(trigger, 250);
}
