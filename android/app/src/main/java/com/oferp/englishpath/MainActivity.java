package com.oferp.englishpath;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Explicitly allow screenshots by removing FLAG_SECURE if it was set
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }
}
