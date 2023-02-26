document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    var launcher_visible = false,
        $wrapper = document.getElementById('wpuadminlauncher'),
        $input = document.getElementById('wpuadminlauncherinput'),
        $autocompleteWrap = document.getElementById('wpuadminlauncher-autocomplete'),
        $list = document.getElementById('wpuadminlauncher-autocomplete-list'),
        list_selected_index = -1,
        list_active_results = [],
        list_max_results = 0,
        list_selected_item = false;

    if (!$input) {
        return;
    }

    var _letter = 'k';
    if (wpuadminlauncher_settings.letter.match(/^[a-z]$/)) {
        _letter = wpuadminlauncher_settings.letter;
    }

    /* Toggle launcher */
    window.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key == _letter && !launcher_visible) {
            display_launcher();
        }
        if (launcher_visible && e.key == 'Escape') {
            hide_launcher();
        }
    });

    /* Hide launcher when click outside */
    document.addEventListener('click', function(e) {
        if (launcher_visible && !$wrapper.contains(e.target)) {
            hide_launcher();
        }
    });

    function display_launcher() {
        launcher_visible = true;
        document.body.setAttribute('data-wpuadminlauncher-visible', '1');
        $input.focus();
    }

    function hide_launcher() {
        document.body.setAttribute('data-wpuadminlauncher-visible', '0');
        launcher_visible = false;
    }

    /* Build autocomplete values */
    (function() {
        /* Extract menu values */
        Array.prototype.forEach.call(document.querySelectorAll('#adminmenu > li'), function(el, i) {
            var $menu = el.querySelector('a:first-child');
            if (!$menu) {
                return;
            }
            var _menu_name = $menu.innerText.trim(),
                _menu_link = $menu.getAttribute('href');
            /* Parent menu */
            wpuadminlauncher_settings.wpuadminlauncheritems.push({
                'label': _menu_name,
                'link': _menu_link
            });
            /* Child elements */
            Array.prototype.forEach.call(el.querySelectorAll('ul a'), function(link, i) {
                var _item_name = link.innerText.trim(),
                    _item_link = link.getAttribute('href');
                /* Avoid a duplicate menu item */
                if (_item_name == _menu_name && _item_link == _menu_link) {
                    return;
                }
                wpuadminlauncher_settings.wpuadminlauncheritems.push({
                    'label': _menu_name + ' &gt; ' + _item_name,
                    'link': link.getAttribute('href')
                });
            });
        });

        /* Extract actions */
        Array.prototype.forEach.call(document.querySelectorAll('.submitbox input[type="submit"]'), function(el, i) {
            wpuadminlauncher_settings.wpuadminlauncheritems.push({
                'label': el.value,
                'icon': 'dashicons-button',
                'click': '#' + el.getAttribute('id')
            });
        });

        /* Clean values */
        for (var i = 0, len = wpuadminlauncher_settings.wpuadminlauncheritems.length; i < len; i++) {
            if (!wpuadminlauncher_settings.wpuadminlauncheritems[i].icon) {
                wpuadminlauncher_settings.wpuadminlauncheritems[i].icon = 'dashicons-admin-links';
            }
            wpuadminlauncher_settings.wpuadminlauncheritems[i].cleanlabel = wpuadminlauncher_settings.wpuadminlauncheritems[i].label.toLowerCase();
        }

    }());

    /* Display autocomplete
    -------------------------- */

    /* Autocomplete navigation */
    $input.addEventListener('keydown', function(e) {
        if (e.key == 'ArrowDown') {
            e.preventDefault();
            list_selected_index++;
            set_active_index();
        }
        if (e.key == 'ArrowUp') {
            e.preventDefault();
            list_selected_index--;
            set_active_index();
        }
        if (e.key == 'Enter') {
            e.preventDefault();
            trigger_selected_item();
        }
    });
    $autocompleteWrap.addEventListener('click', function(e) {
        var $item = false;
        if (e.target.getAttribute('data-i')) {
            $item = e.target;
        }
        if (e.target.parentNode.getAttribute('data-i')) {
            $item = e.target.parentNode;
        }
        if ($item) {
            list_selected_index = parseInt($item.getAttribute('data-i'), 10);
            set_active_index();
            trigger_selected_item();
        }
    });

    function trigger_selected_item() {
        if (!list_selected_item) {
            return;
        }
        if (list_selected_item.link) {
            window.location.href = list_selected_item.link;
        }
        if (list_selected_item.click) {
            document.querySelector(list_selected_item.click).click();
        }
    }

    function set_active_index() {
        if (!list_active_results) {
            return;
        }
        if (list_selected_index < 0) {
            list_selected_index = 0;
        }
        if (list_selected_index > list_max_results) {
            list_selected_index = list_max_results;
        }
        var list_items = $list.querySelectorAll('li[data-value]');
        Array.prototype.forEach.call(list_items, function(item, i) {
            var isActiveItem = (i == list_selected_index);
            item.setAttribute('data-active', isActiveItem ? '1' : '0');
            if (isActiveItem) {
                list_selected_item = list_active_results[i];
            }
        });

    }

    /* Load values */
    $input.addEventListener('keyup', function(e) {
        /* Prevent action keys */
        if (e.key.indexOf('Arrow') > -1 || e.key == 'Enter') {
            return;
        }

        /* Extract all words and init list */
        var list_html = [],
            val = this.value.toLowerCase().split(' ').filter(function(el) {
                return el;
            });

        /* Reset index */
        list_selected_index = -1;
        list_selected_item = false;
        list_max_results = -1;
        list_active_results = [];

        /* Build list */
        if (val.length) {
            for (var i = 0, len = wpuadminlauncher_settings.wpuadminlauncheritems.length; i < len; i++) {
                if (words_are_all_in_text(val, wpuadminlauncher_settings.wpuadminlauncheritems[i].cleanlabel)) {
                    list_html.push(build_list_item(i));
                    list_max_results++;
                    list_active_results.push(wpuadminlauncher_settings.wpuadminlauncheritems[i]);
                }
            }
        }

        /* Fill list element and mark first item as active*/
        $list.innerHTML = list_html.join('');
        set_active_index();
        $autocompleteWrap.setAttribute('data-has-results', list_html ? 1 : 0);
    });

    function build_list_item(i) {
        var list_html = '<li data-value="' + wpuadminlauncher_settings.wpuadminlauncheritems[i].link + '">';
        list_html += '<span class="inner" data-i="' + i + '">';
        list_html += '<span class="dashicons ' + wpuadminlauncher_settings.wpuadminlauncheritems[i].icon + '"></span>';
        list_html += wpuadminlauncher_settings.wpuadminlauncheritems[i].label;
        list_html += '</span>';
        list_html += '</li>';
        return list_html;
    }

    /* Check if all words are present in a text */
    function words_are_all_in_text(words, text) {
        var _match = true;
        for (var i = 0, len = words.length; i < len; i++) {
            if (!words[i]) {
                continue;
            }
            if (text.indexOf(words[i]) < 0) {
                _match = false;
            }
        }
        return _match;
    }
});
