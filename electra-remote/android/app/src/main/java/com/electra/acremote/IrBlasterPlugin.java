package com.electra.acremote;

import android.content.Context;
import android.hardware.ConsumerIrManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/**
 * Bridges the web layer to the phone's infrared emitter.
 *
 * Android exposes exactly one way to do this — {@link ConsumerIrManager} — and
 * only a minority of handsets have the LED behind it (Xiaomi/Redmi/Poco are the
 * usual suspects, plus older Huawei and Samsung models). There is no software
 * fallback: without the hardware, nothing can be transmitted, so
 * {@code isAvailable} exists to let the UI say so plainly instead of pretending.
 *
 * Capacitor dispatches plugin calls on a background thread, so blocking inside
 * {@code transmit} for the ~200 ms an Electra frame takes is safe.
 */
@CapacitorPlugin(name = "IrBlaster")
public class IrBlasterPlugin extends Plugin {

    private ConsumerIrManager irManager;

    @Override
    public void load() {
        irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
    }

    private boolean hasEmitter() {
        return irManager != null && irManager.hasIrEmitter();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        boolean available = hasEmitter();
        result.put("available", available);

        JSArray frequencies = new JSArray();
        if (available) {
            ConsumerIrManager.CarrierFrequencyRange[] ranges = irManager.getCarrierFrequencies();
            if (ranges != null) {
                for (ConsumerIrManager.CarrierFrequencyRange range : ranges) {
                    JSObject entry = new JSObject();
                    entry.put("min", range.getMinFrequency());
                    entry.put("max", range.getMaxFrequency());
                    frequencies.put(entry);
                }
            }
        }
        result.put("frequencies", frequencies);

        call.resolve(result);
    }

    @PluginMethod
    public void transmit(PluginCall call) {
        if (!hasEmitter()) {
            call.reject("This device has no infrared emitter");
            return;
        }

        int frequency = call.getInt("frequency", 38000);

        JSArray patternArg = call.getArray("pattern");
        if (patternArg == null) {
            call.reject("Missing pattern");
            return;
        }

        int[] pattern;
        try {
            List<Object> values = patternArg.toList();
            if (values.isEmpty()) {
                call.reject("Pattern is empty");
                return;
            }
            pattern = new int[values.size()];
            for (int i = 0; i < values.size(); i++) {
                Object value = values.get(i);
                if (!(value instanceof Number)) {
                    call.reject("Pattern must contain only numbers");
                    return;
                }
                // JSON has no integers, so durations arrive as Double on some
                // WebView builds and Integer on others.
                pattern[i] = (int) Math.round(((Number) value).doubleValue());
                if (pattern[i] <= 0) {
                    call.reject("Pattern durations must be positive");
                    return;
                }
            }
        } catch (org.json.JSONException e) {
            call.reject("Could not read pattern", e);
            return;
        }

        try {
            irManager.transmit(frequency, pattern);
            call.resolve();
        } catch (IllegalArgumentException e) {
            // Thrown when the requested carrier frequency is out of range for
            // this emitter, or the pattern is longer than the driver accepts.
            call.reject("The emitter rejected this signal: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            call.reject("IR transmit failed: " + e.getMessage(), e);
        }
    }
}
