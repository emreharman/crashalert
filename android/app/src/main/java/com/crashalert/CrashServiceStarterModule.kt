package com.crashalert

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CrashServiceStarterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CrashServiceStarter"

    @ReactMethod
    fun startService() {
        val serviceIntent = Intent(reactContext, CrashDetectionService::class.java)
        reactContext.startForegroundService(serviceIntent)
    }
}
