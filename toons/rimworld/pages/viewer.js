function init()
{
    let episode = new URL(window.location.href).searchParams.get("episode")
    let path = `${episode}.jpg`

    viewer_content.src = path
}
