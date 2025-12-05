export function validateProjectName(name) {
    if (typeof name !== "string" || name.trim() === "") {
        return false;
    }
    // Optimization: Allow only alphanumeric, dashes, underscores
    const valid = /^[a-zA-Z0-9_-]+$/.test(name);
    return valid;
}

export function validateFunctionName(name) {
    if (typeof name !== "string" || name.trim() === "") {
        return false;
    }
    // Optimization: Allow alphanumeric, dashes, underscores
    const valid = /^[a-zA-Z0-9_-]+$/.test(name);
    return valid;
}