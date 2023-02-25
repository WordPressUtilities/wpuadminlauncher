document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    var launcher_visible = false,
        $input = document.getElementById('wpuadminlauncherinput'),
        $autocompleteWrap = document.getElementById('wpuadminlauncher-autocomplete'),
        $list = document.getElementById('wpuadminlauncher-autocomplete-list'),
        list_selected_index = -1,
        list_active_results = [],
        list_max_results = 0,
        list_selected_value = '';

    window.wpuadminlauncheritems = [];

    /* Toggle Launcher */
    document.addEventListener('keydown', function(e) {
        if (e.metaKey && e.key == 'k' && !launcher_visible) {
            display_launcher();
        }
        if (launcher_visible && e.key == 'Escape') {
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
            window.wpuadminlauncheritems.push({
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
                window.wpuadminlauncheritems.push({
                    'label': _menu_name + ' &gt; ' + _item_name,
                    'link': link.getAttribute('href')
                });
            });
        });

        /* Clean values */
        for (var i = 0, len = window.wpuadminlauncheritems.length; i < len; i++) {
            window.wpuadminlauncheritems[i].cleanlabel = window.wpuadminlauncheritems[i].label.toLowerCase();
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
            if (list_selected_value) {
                window.location.href = list_selected_value;
            }
        }
    });

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
                list_selected_value = list_active_results[i].link;
            }
        });

    }

    /* Load values */
    $input.addEventListener('keyup', function(e) {
        /* Prevent action keys */
        if (e.key.indexOf('Arrow') > -1 || e.key == 'Enter') {
            return;
        }

        var val = this.value.toLowerCase(),
            list_html = '';

        /* Reset index */
        list_selected_index = -1;
        list_selected_value = '';
        list_max_results = -1;
        list_active_results = [];
        /* Build list */
        if (val) {
            for (var i = 0, len = window.wpuadminlauncheritems.length; i < len; i++) {
                if (window.wpuadminlauncheritems[i].cleanlabel.indexOf(val) >= 0) {
                    list_html += '<li data-value="' + window.wpuadminlauncheritems[i].link + '">';
                    list_html += '<a href="' + window.wpuadminlauncheritems[i].link + '">' + window.wpuadminlauncheritems[i].label + '</a>';
                    list_html += '</li>';
                    list_max_results++;
                    list_active_results.push(window.wpuadminlauncheritems[i]);
                }
            }
        }
        $list.innerHTML = list_html;
        set_active_index();

        $autocompleteWrap.setAttribute('data-has-results', list_html ? 1 : 0);
    });
});
