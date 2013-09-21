const Applet = imports.ui.applet;
const Settings = imports.ui.settings;
const Tweener = imports.ui.tweener;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Util = imports.misc.util;
const Lang = imports.lang;
const Mainloop = imports.mainloop;


const UUID = "commandLauncher@scollins";
const ICON_HEIGHT = 22;


function MyApplet(orientation, panel_height, instanceId) {
    this._init(orientation, panel_height, instanceId);
}

MyApplet.prototype =  {
    __proto__: Applet.IconApplet.prototype,
    
    _init: function(orientation, panel_height, instanceId) {
        try {
            this.orientation = orientation;
            this.panel_height = panel_height;
            this.instanceId = instanceId;
            Applet.IconApplet.prototype._init.call(this, this.orientation, panel_height);
            
            this._bind_settings();
            
            this._set_icon();
            this._set_tooltip();
            
        } catch(e) {
            global.logError(e);
        }
    },
    
    on_applet_clicked: function(event) {
        try {
            let allocation = this._applet_icon_box.get_allocation_box();
            this._applet_icon_box.width = allocation.x2 - allocation.x1;
            this._applet_icon_box.height = allocation.y2 - allocation.y1;
            this._animate(3);
            if ( this.command == "" ) this._open_settings();
            else Util.spawnCommandLine(this.command);
        } catch(e) {
            global.logError(e);
        }
    },
    
    _bind_settings: function () {
        this.settings = new Settings.AppletSettings(this, UUID, this.instanceId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "icon", "icon", this._set_icon);
        this.settings.bindProperty(Settings.BindingDirection.IN, "command", "command", function(){});
        this.settings.bindProperty(Settings.BindingDirection.IN, "description", "description", this._set_tooltip);
    },
    
    _set_icon: function() {
        if ( this.icon.split("/").length > 1 ) this.set_applet_icon_path(this.icon);
        else {
            this._applet_icon = St.TextureCache.get_default().load_gicon(null, new Gio.ThemedIcon({ name: this.icon }), ICON_HEIGHT);
            this._applet_icon_box.child = this._applet_icon;
            this.__icon_type = -1;
            this.__icon_name = this.icon;
        }
    },
    
    _set_tooltip: function() {
        this.set_applet_tooltip(this.description);
    },
    
    locate: function() {
        let box = this.actor;
        box.add_style_pseudo_class("highlight");
        Mainloop.timeout_add(3000, function() { box.remove_style_pseudo_class("highlight"); });
    },
    
    _animate:function(count) {
        if ( count < 1 ) return;
        Tweener.addTween(this._applet_icon, {
            width: ICON_HEIGHT * .8,
            height: ICON_HEIGHT * .8,
            time: 0.2,
            transition: 'easeOutQuad',
            onComplete: function() {
                Tweener.addTween(this._applet_icon, {
                    width: ICON_HEIGHT,
                    height: ICON_HEIGHT,
                    time: 0.2,
                    transition: 'easeOutQuad',
                    onComplete: function() {
                        this._animate(count-1);
                    },
                    onCompleteScope: this
                });
            },
            onCompleteScope: this
        });
    }
}


function main(metadata, orientation, panel_height, instanceId) {
    let myApplet = new MyApplet(orientation, panel_height, instanceId);
    return myApplet;
}