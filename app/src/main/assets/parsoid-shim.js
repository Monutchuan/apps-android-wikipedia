/* Minimal PCS-compatible shim for plain MediaWiki Parsoid HTML. */
if (window.__parsoidShimInstalled) {
    return;
}
window.__parsoidShimInstalled = true;

function __pcsSend(action, data) {
    try {
        if (window.pcsClient && window.pcsClient.onReceiveMessage) {
            window.pcsClient.onReceiveMessage(JSON.stringify({ action: action, data: data || {} }));
        }
    } catch (e) {
        /* ignore */
    }
}

function __pcsNormalizeHref(href) {
    if (!href) {
        return href;
    }
    if (href.charAt(0) === '#' || href.indexOf('index.php') >= 0 || href.indexOf('//') === 0) {
        return href;
    }
    if (href.indexOf('./') === 0) {
        return '/wiki/' + href.substring(2);
    }
    if (href.charAt(0) === '/' && href.indexOf('/wiki/') !== 0) {
        return '/wiki/' + href.substring(1);
    }
    return href;
}

function __pcsBuildToc() {
    var heads = document.querySelectorAll('h2, h3, h4');
    var levels = { H2: 2, H3: 3, H4: 4 };
    var result = [];
    for (var i = 0; i < heads.length; i++) {
        var heading = heads[i];
        var title = (heading.textContent || '').replace(/\s+/g, ' ').trim();
        if (!title) {
            continue;
        }
        result.push({
            id: result.length + 1,
            level: levels[heading.tagName] || 2,
            title: title,
            anchor: heading.id || '',
            text: ''
        });
    }
    return result;
}

function __pcsStyle() {
    var style = document.createElement('style');
    style.innerHTML = 'html,body{margin:0;padding:0;-webkit-text-size-adjust:100%}' +
        'body{padding:16px 16px 56px;font-size:16px;line-height:1.65;overflow-x:hidden;word-wrap:break-word}' +
        'img,video{max-width:100%;height:auto}' +
        'table{display:block;max-width:100%;overflow-x:auto}' +
        '.mw-editsection,.navbox,.vector-toc,#mw-navigation,#mw-head,#mw-panel,.mw-footer,.printfooter{display:none!important}' +
        'a{color:#2962ff;text-decoration:none}';
    (document.head || document.documentElement).appendChild(style);
}

function __pcsRewriteLinks() {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
        var normalized = __pcsNormalizeHref(links[i].getAttribute('href'));
        if (normalized !== links[i].getAttribute('href')) {
            links[i].setAttribute('href', normalized);
        }
    }
}

window.pcs = {
    c1: {
        Page: {
            setMargins: function () { },
            getRevision: function () { return null; },
            getProtection: function () { return {}; },
            getTableOfContents: function () { return __pcsBuildToc(); },
            prepareForScrollToAnchor: function (anchor) {
                var id = (anchor || '').indexOf('#') >= 0 ? anchor.substring(anchor.indexOf('#') + 1) : anchor;
                var el = id ? document.getElementById(id) : null;
                if (el) {
                    el.scrollIntoView();
                }
            },
            setEditButtons: function () { }
        },
        Sections: {
            getOffsets: function () {
                var heads = document.querySelectorAll('h2');
                var offsets = [];
                for (var i = 0; i < heads.length; i++) {
                    offsets.push({ id: heads[i].id || '', offset: heads[i].offsetTop });
                }
                return offsets;
            }
        },
        InteractionHandling: {
            getSelectionInfo: function () {
                var selection = window.getSelection();
                var text = selection ? selection.toString() : '';
                return { text: text, section: '' };
            }
        },
        Footer: {
            MenuItemType: {
                lastEdited: 'lastEdited',
                talkPage: 'talkPage',
                coordinate: 'coordinate',
                referenceList: 'referenceList'
            },
            add: function () { }
        }
    }
};

document.addEventListener('click', function (event) {
    var node = event.target;
    while (node && node.tagName !== 'A') {
        node = node.parentElement;
    }
    if (!node) {
        return;
    }
    var href = __pcsNormalizeHref(node.getAttribute('href') || '');
    if (!href) {
        return;
    }
    if (href.charAt(0) === '#') {
        event.preventDefault();
        var el = document.getElementById(decodeURIComponent(href.substring(1)));
        if (el) {
            el.scrollIntoView();
        }
        return;
    }
    event.preventDefault();
    var isImage = node.querySelector('img') !== null || (event.target.tagName === 'IMG');
    __pcsSend(isImage ? 'image' : 'link', {
        href: href,
        text: (node.textContent || '').replace(/\s+/g, ' ').trim()
    });
}, true);

__pcsStyle();
__pcsRewriteLinks();

__pcsSend('setup', {});
__pcsSend('final_setup', {});
