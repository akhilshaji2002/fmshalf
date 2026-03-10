async function test() {
    try {
        const response = await fetch("https://text.pollinations.ai/models");
        const data = await response.json();
        require('fs').writeFileSync('pollinations_models.json', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
