<?php
/*
Plugin Name: WPU Admin Launcher
Plugin URI: https://github.com/WordPressUtilities/wpuadminlauncher
Update URI: https://github.com/WordPressUtilities/wpuadminlauncher
Description: WPU Admin Launcher is a simple tasks launcher. Just press CMD+k and enjoy.
Version: 0.1.0
Author: Darklg
Author URI: https://Darklg.me/
Text Domain: wpuadminlauncher
Domain Path: /lang/
License: MIT License
License URI: https://opensource.org/licenses/MIT
*/

class WPUAdminLauncher {
    private $plugin_version = '0.1.0';
    private $plugin_settings = array(
        'id' => 'wpuadminlauncher',
        'name' => 'WPU Admin Launcher'
    );
    private $settings_obj;

    public function __construct() {
        add_filter('plugins_loaded', array(&$this, 'plugins_loaded'));

        # Back Assets
        add_action('admin_enqueue_scripts', array(&$this, 'admin_enqueue_scripts'));

        # Launcher
        add_action('admin_footer', array(&$this, 'display_launcher'));
    }

    public function plugins_loaded() {
        # TRANSLATION
        if (!load_plugin_textdomain('wpuadminlauncher', false, dirname(plugin_basename(__FILE__)) . '/lang/')) {
            load_muplugin_textdomain('wpuadminlauncher', dirname(plugin_basename(__FILE__)) . '/lang/');
        }
        $this->plugin_description = __('WPU Admin Launcher is a simple tasks launcher. Just press CMD+k and enjoy.', 'wpuadminlauncher');
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
                'import' => array(
                    'name' => __('Import Settings', 'wpuadminlauncher')
                )
            )
        );
        $this->settings = array(
            'value' => array(
                'label' => __('My Value', 'wpuadminlauncher'),
                'help' => __('A little help.', 'wpuadminlauncher'),
                'type' => 'textarea'
            )
        );
        include dirname(__FILE__) . '/inc/WPUBaseSettings/WPUBaseSettings.php';
        $this->settings_obj = new \wpuadminlauncher\WPUBaseSettings($this->settings_details, $this->settings);
    }

    public function admin_enqueue_scripts() {
        /* Back Style */
        wp_register_style('wpuadminlauncher_back_style', plugins_url('assets/back.css', __FILE__), array(), $this->plugin_version);
        wp_enqueue_style('wpuadminlauncher_back_style');
        /* Back Script */
        wp_register_script('wpuadminlauncher_back_script', plugins_url('assets/back.js', __FILE__), array(), $this->plugin_version, true);
        wp_enqueue_script('wpuadminlauncher_back_script');
    }

    public function display_launcher() {
        echo '<div class="wpuadminlauncher">';
        echo '<div class="wpuadminlauncher__inner">';
        echo '<input class="wpuadminlauncherinput" name="wpuadminlauncherinput" id="wpuadminlauncherinput" type="text" />';
        echo '<div id="wpuadminlauncher-autocomplete" class="wpuadminlauncher-autocomplete"><ul id="wpuadminlauncher-autocomplete-list">';
        echo '</ul></div>';
        echo '</div>';
        echo '</div>';
    }
}

$WPUAdminLauncher = new WPUAdminLauncher();
