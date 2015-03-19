const Applet = imports.ui.applet;
const Main = imports.ui.main;
const Settings = imports.ui.settings;
const Tweener = imports.ui.tweener;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Util = imports.misc.util;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const SCALE_FACTOR = 0.8;
const TRANSITION_TIME = 0.2;
const NUMBER_OF_BOUNCES = 3;


function MyApplet(metadata, orientation, panelHeight, instanceId) {
    this._init(metadata, orientation, panelHeight, instanceId);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,
    
    _init: function(metadata, orientation, panelHeight, instanceId) {
        try {
            
            this.metadata = metadata;
            this.instanceId = instanceId;
            this.orientation = orientation;
            
            Applet.IconApplet.prototype._init.call(this, this.orientation, panelHeight);
            
            this._bindSettings();
            
            //set up panel
            this.setPanelIcon();
            this.setTooltip();
            
        } catch(e) {
            global.logError(e);
        }
    },
    
    on_applet_clicked: function(event) {
        this.launch();
    },
    
    _bindSettings: function () {
        this.settings = new Settings.AppletSettings(this, this.metadata["uuid"], this.instanceId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "panelIcon", "panelIcon", this.setPanelIcon);
        this.settings.bindProperty(Settings.BindingDirection.IN, "symbolicPanelIcon", "symbolicPanelIcon", this.setPanelIcon);
        this.settings.bindProperty(Settings.BindingDirection.IN, "command", "command", function(){});
        this.settings.bindProperty(Settings.BindingDirection.IN, "description", "description", this.setTooltip);
        this.settings.bindProperty(Settings.BindingDirection.IN, "useAltEnv", "useAltEnv");
        this.settings.bindProperty(Settings.BindingDirection.IN, "altEnv", "altEnv");
        this.settings.bindProperty(Settings.BindingDirection.IN, "keyLaunch", "keyLaunch", this.setKeybinding);
        this.setKeybinding();
    },
    
    setKeybinding: function() {
        if ( this.keyId ) Main.keybindingManager.removeHotKey(this.keyId);
        if ( this.keyLaunch == "" ) return;
        this.keyId = "commandLauncher-" + this.instanceId;
        Main.keybindingManager.addHotKey(this.keyId, this.keyLaunch, Lang.bind(this, this.launch));
    },
    
    launch: function() {
        this._applet_icon.scale_gravity = Clutter.Gravity.CENTER;
        this._animate(NUMBER_OF_BOUNCES);
        if ( this.command == "" ) Util.spawnCommandLine("cinnamon-settings applets " + this.metadata.uuid + " " + this.instanceId);
        else {
            let basePath = null;
            if ( this.useAltEnv && Gio.file_new_for_path(this.altEnv).query_exists(null) ) basePath = this.altEnv;
            
            let input = this.command.replace("~/", GLib.get_home_dir() + "/"); //replace all ~/ with path to home directory
            let [success, argv] = GLib.shell_parse_argv(input);
            
            if ( !success ) {
                Main.notify("Unable to parse \"" + input + "\"");
                return;
            }
            
            try {
                let flags = GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD;
                let [result, pid] = GLib.spawn_async(basePath, argv, null, flags, null);
                GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, this.onClosed), null);
            } catch(e) {
                Main.notify("Error while trying to run \"" + input + "\"", e.message);
                return;
            }
        }
    },
    
    _animate:function(count) {
        if ( count < 1 ) return;
        Tweener.addTween(this._applet_icon, {
            scale_x: SCALE_FACTOR,
            scale_y: SCALE_FACTOR,
            time: TRANSITION_TIME,
            transition: 'easeOutQuad',
            onComplete: function() {
                Tweener.addTween(this._applet_icon, {
                    scale_x: 1,
                    scale_y: 1,
                    time: TRANSITION_TIME,
                    transition: 'easeOutQuad',
                    onComplete: function() {
                        this._animate(count-1);
                    },
                    onCompleteScope: this
                });
            },
            onCompleteScope: this
        });
    },
    
    setPanelIcon: function() {
        if ( this.panelIcon.split("/").length > 1 ) {
            if ( this.symbolicPanelIcon && this.panelIcon.search("-symbolic.svg") > 0 ) this.set_applet_icon_symbolic_path(this.panelIcon);
            else this.set_applet_icon_path(this.panelIcon);
        }
        else {
            if ( this.symbolicPanelIcon ) this.set_applet_icon_symbolic_name(this.panelIcon);
            else this.set_applet_icon_name(this.panelIcon);
        }
    },
    
    setTooltip: function() {
        this.set_applet_tooltip(this.description);
    },
    
    set_applet_icon_symbolic_path: function(icon_path) {
        if (this._applet_icon_box.child) this._applet_icon_box.child.destroy();
        
        if (icon_path){
            let file = Gio.file_new_for_path(icon_path);
            let gicon = new Gio.FileIcon({ file: file });
            if (this._scaleMode) {
                let height = (this._panelHeight / DEFAULT_PANEL_HEIGHT) * PANEL_SYMBOLIC_ICON_DEFAULT_HEIGHT;
                this._applet_icon = new St.Icon({gicon: gicon, icon_size: height,
                                                icon_type: St.IconType.SYMBOLIC, reactive: true, track_hover: true, style_class: "applet-icon" });
            } else {
                this._applet_icon = new St.Icon({gicon: gicon, icon_size: 22, icon_type: St.IconType.FULLCOLOR, reactive: true, track_hover: true, style_class: "applet-icon" });
            }
            this._applet_icon_box.child = this._applet_icon;
        }
        this.__icon_type = -1;
        this.__icon_name = icon_path;
    },
    
    onClosed: function(pid) {
        Main.notify("Command Completed");
    }
}


function main(metadata, orientation, panelHeight, instanceId) {
    let myApplet = new MyApplet(metadata, orientation, panelHeight, instanceId);
    return myApplet;
}