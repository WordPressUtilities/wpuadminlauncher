<?php
defined('ABSPATH') || die;
/*
Plugin Name: WPU Admin Launcher
Plugin URI: https://github.com/WordPressUtilities/wpuadminlauncher
Update URI: https://github.com/WordPressUtilities/wpuadminlauncher
Description: WPU Admin Launcher is a simple tasks launcher. Just press CMD+k or Ctrl+k and enjoy.
Version: 0.8.2
Author: Darklg
Author URI: https://darklg.me/
Text Domain: wpuadminlauncher
Domain Path: /lang
Requires at least: 6.2
Requires PHP: 8.0
Network: Optional
License: MIT License
License URI: https://opensource.org/licenses/MIT
*/

class WPUAdminLauncher {
    public $plugin_description;
    public $settings_details;
    public $settings;
    public $settings_update;
    private $plugin_version = '0.8.2';
    private $plugin_settings = array(
        'id' => 'wpuadminlauncher',
        'name' => 'WPU Admin Launcher'
    );
    private $settings_obj;

    public function __construct() {
        add_action('init', array(&$this, 'load_translation'));
        add_action('init', array(&$this, 'init'));

        # Back Assets
        add_action('admin_enqueue_scripts', array(&$this, 'admin_enqueue_scripts'));

        # Launcher
        add_action('admin_footer', array(&$this, 'display_launcher'));
    }

    public function load_translation() {
        # TRANSLATION
        $lang_dir = dirname(plugin_basename(__FILE__)) . '/lang/';
        if (strpos(__DIR__, 'mu-plugins') !== false) {
            load_muplugin_textdomain('wpuadminlauncher', $lang_dir);
        } else {
            load_plugin_textdomain('wpuadminlauncher', false, $lang_dir);
        }
        $this->plugin_description = __('WPU Admin Launcher is a simple tasks launcher. Just press CMD+k or Ctrl+k and enjoy.', 'wpuadminlauncher');

    }

    public function init() {
        # SETTINGS
        $this->settings_details = array(
            # Admin page
            'create_page' => true,
            'plugin_basename' => plugin_basename(__FILE__),
            # Default
            'plugin_name' => $this->plugin_settings['name'],
            'plugin_id' => $this->plugin_settings['id'],
            'option_id' => $this->plugin_settings['id'] . '_options',
            'sections' => array(
                'default' => array(
                    'name' => __('Settings', 'wpuadminlauncher')
                )
            )
        );
        $letters = array(__('Default (K)', 'wpuadminlauncher'));
        $raw_letters = str_split('ijku');
        foreach ($raw_letters as $letter) {
            $letters[$letter] = ucfirst($letter);
        }
        $this->settings = array(
            'letter' => array(
                'label' => __('Shortcut', 'wpuadminlauncher'),
                'type' => 'select',
                'help' => __('Press CMD + this letter', 'wpuadminlauncher'),
                'datas' => $letters
            )
        );
        require_once __DIR__ . '/inc/WPUBaseSettings/WPUBaseSettings.php';
        $this->settings_obj = new \wpuadminlauncher\WPUBaseSettings($this->settings_details, $this->settings);

        # Auto update
        require_once __DIR__ . '/inc/WPUBaseUpdate/WPUBaseUpdate.php';
        $this->settings_update = new \wpuadminlauncher\WPUBaseUpdate(
            'WordPressUtilities',
            'wpuadminlauncher',
            $this->plugin_version);

        # AJAX
        if (is_admin() && is_user_logged_in()) {
            add_action('wp_ajax_wpuadminlauncher_posttypes', array(&$this, 'wpuadminlauncher_posttypes'));
        }
    }

    public function admin_enqueue_scripts() {
        /* Back Style */
        wp_register_style('wpuadminlauncher_back_style', plugins_url('assets/back.css', __FILE__), array(), $this->plugin_version);
        wp_enqueue_style('wpuadminlauncher_back_style');
        /* Back Script */
        wp_register_script('wpuadminlauncher_back_script', plugins_url('assets/back.js', __FILE__), array(), $this->plugin_version, true);
        wp_enqueue_script('wpuadminlauncher_back_script');
        wp_localize_script('wpuadminlauncher_back_script', 'wpuadminlauncher_settings', array(
            'wpuadminlauncheritems' => array(),
            'edit_url' => admin_url('post.php?action=edit&post='),
            'edit_menu_url' => admin_url('nav-menus.php?action=edit&menu='),
            'edit_user_url' => admin_url('user-edit.php?user_id='),
            'ajax_url' => admin_url('admin-ajax.php'),
            'letter' => $this->settings_obj->get_setting('letter'),
            'str_noresults' => __('No results available', 'wpuadminlauncher')
        ));
    }

    public function display_launcher() {
        $placeholder = __('Type where you wish to go and press the Enter key', 'wpuadminlauncher');
        echo '<div id="wpuadminlauncher" class="wpuadminlauncher">';
        echo '<div class="wpuadminlauncher__inner">';
        echo '<input class="wpuadminlauncherinput" name="wpuadminlauncherinput" id="wpuadminlauncherinput" type="text" placeholder="' . esc_attr($placeholder) . '" />';
        echo '<div id="wpuadminlauncher-autocomplete" class="wpuadminlauncher-autocomplete"><ul id="wpuadminlauncher-autocomplete-list">';
        echo '</ul></div>';
        echo '</div>';
        echo '</div>';
    }

    public function wpuadminlauncher_posttypes() {

        global $wp_post_statuses;

        /* Get all post types */
        $post_types = get_post_types(array(
            'public' => true
        ), 'objects');
        if (isset($post_types['attachment'])) {
            unset($post_types['attachment']);
        }

        /* Get only needed fields in query */
        add_filter('posts_fields', function ($fields) {
            return 'ID,post_title,post_status';
        });

        $post_type_obj = array();
        $posts = array();
        foreach ($post_types as $pt => $post_type) {
            $post_type_obj[$pt] = array(
                'icon' => $post_type->menu_icon,
                'label' => $post_type->label
            );

            $items = get_posts(array(
                'orderby' => 'name',
                'order' => 'ASC',
                'post_type' => $pt,
                'post_status' => array(
                    'publish',
                    'pending',
                    'draft',
                    'future',
                    'private'
                ),
                'posts_per_page' => 500
            ));
            foreach ($items as $item) {
                $title = $item->post_title;
                if ($item->post_status != 'publish' && isset($wp_post_statuses) && is_array($wp_post_statuses)) {
                    $title .= ' (' . $wp_post_statuses[$item->post_status]->label . ')';
                }
                $posts[] = array(
                    'pt' => $pt,
                    'id' => $item->ID,
                    'ti' => $title
                );
            }
        }

        $menus = array();
        if (current_user_can('edit_theme_options')) {
            $menus_t = get_terms('nav_menu', array('hide_empty' => false));
            $menus_obj = get_taxonomy('nav_menu');
            $post_type_obj['nav_menu'] = array(
                'icon' => 'dashicons-menu',
                'label' => $menus_obj->label
            );
            foreach ($menus_t as $menu) {
                $menus[] = array(
                    'id' => $menu->term_id,
                    'ti' => $menu->name
                );
            }
        }

        $users = array();
        if (current_user_can('edit_users')) {
            $users_t = get_users(array(
                'number' => 500
            ));
            $post_type_obj['users'] = array(
                'icon' => 'dashicons-admin-users',
                'label' => __('Users')
            );
            foreach ($users_t as $user) {
                $users[] = array(
                    'id' => $user->ID,
                    'ti' => $user->display_name
                );
            }
        }

        wp_send_json_success(array(
            'users' => $users,
            'menus' => $menus,
            'posts' => $posts,
            'post_types' => $post_type_obj
        ));
    }
}

$WPUAdminLauncher = new WPUAdminLauncher();
