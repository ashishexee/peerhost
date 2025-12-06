export function parseWalletFromHost(host) {
    if (!host) return null;

    const hostname = host.split(':')[0];
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0].toLowerCase();
    }
    if (parts.length === 2 && parts[1] === 'localhost') {
        return parts[0].toLowerCase();
    }

    return null;
}
