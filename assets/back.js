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
        load_autocomplete_post_types();
    }

    function hide_launcher() {
        document.body.setAttribute('data-wpuadminlauncher-visible', '0');
        launcher_visible = false;
    }

    /* Build autocomplete values */
    (function() {
        /* Extract menu values */
        Array.prototype.forEach.call(document.querySelectorAll('#wp-admin-bar-w3tc, #wp-admin-bar-view, #adminmenu > li'), function(el, i) {
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
            wpuadminlauncher_settings.wpuadminlauncheritems[i].cleanlabel = clean_string(wpuadminlauncher_settings.wpuadminlauncheritems[i].label);
        }

        /* Sort results */
        wpuadminlauncher_settings.wpuadminlauncheritems.sort(function(a, b) {
            return a.label.localeCompare(b.label);
        });
    }());

    function load_autocomplete_post_types() {
        if (wpuadminlauncher_settings.post_types_content) {
            return;
        }
        jQuery.post(wpuadminlauncher_settings.ajax_url, {
            'action': 'wpuadminlauncher_posttypes',
        }, function(response) {
            wpuadminlauncher_settings.post_types_content = response.data.post_types;
            /* Post types */
            (function() {
                var post_title;
                for (var i = 0, len = response.data.posts.length; i < len; i++) {
                    post_title = response.data.post_types[response.data.posts[i].pt].label + ' &gt; ' + response.data.posts[i].ti;
                    wpuadminlauncher_settings.wpuadminlauncheritems.push({
                        'label': post_title,
                        'icon': response.data.post_types[response.data.posts[i].pt].icon,
                        'link': wpuadminlauncher_settings.edit_url + response.data.posts[i].id,
                        'cleanlabel': clean_string(post_title)
                    });
                }
            }());
            /* Menus */
            (function() {
                var menu_title;
                for (var i = 0, len = response.data.menus.length; i < len; i++) {
                    menu_title = response.data.post_types.nav_menu.label + ' &gt; ' + response.data.menus[i].ti;
                    wpuadminlauncher_settings.wpuadminlauncheritems.push({
                        'label': menu_title,
                        'icon': response.data.post_types.nav_menu.icon,
                        'link': wpuadminlauncher_settings.edit_menu_url + response.data.menus[i].id,
                        'cleanlabel': clean_string(menu_title)
                    });
                }
            }());
            /* Users */
            (function() {
                var user_title;
                for (var i = 0, len = response.data.users.length; i < len; i++) {
                    user_title = response.data.post_types.users.label + ' &gt; ' + response.data.users[i].ti;
                    wpuadminlauncher_settings.wpuadminlauncheritems.push({
                        'label': user_title,
                        'icon': response.data.post_types.users.icon,
                        'link': wpuadminlauncher_settings.edit_user_url + response.data.users[i].id,
                        'cleanlabel': clean_string(user_title)
                    });
                }
            }());
        });
    }

    /* Display autocomplete
    -------------------------- */

    /* Autocomplete navigation */
    $input.addEventListener('keydown', function(e) {
        if (e.key == 'ArrowDown') {
            e.preventDefault();
            list_selected_index++;
            set_active_index('down');
        }
        if (e.key == 'ArrowUp') {
            e.preventDefault();
            list_selected_index--;
            set_active_index('up');
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

    function set_active_index(dir) {
        if (!list_active_results) {
            return;
        }
        if (list_selected_index < 0) {
            list_selected_index = 0;
        }
        if (list_selected_index > list_max_results) {
            list_selected_index = list_max_results;
        }
        var list_items = $list.querySelectorAll('li[data-value]'),
            list_height = $list.offsetHeight;
        Array.prototype.forEach.call(list_items, function(item, i) {
            var isActiveItem = (i == list_selected_index);
            item.setAttribute('data-active', isActiveItem ? '1' : '0');
            if (isActiveItem) {
                if (dir) {
                    var scrollPosTop = item.offsetTop + item.offsetHeight;
                    if (dir == 'down' && scrollPosTop > (list_height + $list.scrollTop)) {
                        $list.scrollTop = scrollPosTop - list_height;
                    }
                    if (dir == 'up' && $list.scrollTop > item.offsetTop) {
                        $list.scrollTop = item.offsetTop;
                    }
                }
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

        var _value = this.value;
        var _tmpItems = [];
        /*
        if (this.value.substring(0,6) == 'test12') {
            _value = _value.substring(6);
            _tmpItems = wpuadminlauncher_settings.wpuadminlauncheritems;
            wpuadminlauncher_settings.wpuadminlauncheritems = [];
            wpuadminlauncher_settings.wpuadminlauncheritems.push({
                'cleanlabel': 'test1',
                'label': 'test 1',
                'link': '#'
            });
            wpuadminlauncher_settings.wpuadminlauncheritems.push({
                'cleanlabel': 'test2',
                'label': 'test 2',
                'link': '#'
            });
        }
        */

        /* Extract all words and init list */
        var list_html = [],
            val = clean_string(_value).split(' ').filter(function(el) {
                return el;
            });

        /* Reset index */
        list_selected_index = -1;
        list_selected_item = false;
        list_max_results = -1;
        list_active_results = [];

        /* Build list */
        if (val.length) {
            /* Load actions */
            for (var i = 0, len = wpuadminlauncher_settings.wpuadminlauncheritems.length; i < len; i++) {
                if (words_are_all_in_text(val, wpuadminlauncher_settings.wpuadminlauncheritems[i].cleanlabel)) {
                    list_html.push(build_list_item(i));
                    list_max_results++;
                    list_active_results.push(wpuadminlauncher_settings.wpuadminlauncheritems[i]);
                }
            }
            if (!list_html.length) {
                list_html.push('<li data-noresults="1"><span class="inner"><span class="dashicons dashicons-warning"></span>' + wpuadminlauncher_settings.str_noresults + '</span></li>');
            }
        }

        /* Fill list element and mark first item as active*/
        $list.innerHTML = list_html.join('');
        set_active_index();
        $autocompleteWrap.setAttribute('data-has-results', list_html ? 1 : 0);

        if (_tmpItems && _tmpItems.length) {
            wpuadminlauncher_settings.wpuadminlauncheritems = _tmpItems;
        }
    });

    function clean_string(str) {
        str = str.toLowerCase();
        if (str.normalize) {
            str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        return str;
    }

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
