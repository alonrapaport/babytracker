package com.electra.acremote;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be registered before the bridge starts, or the web layer will
        // not see the plugin.
        registerPlugin(IrBlasterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
