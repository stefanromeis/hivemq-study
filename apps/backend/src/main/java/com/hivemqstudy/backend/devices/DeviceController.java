package com.hivemqstudy.backend.devices;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Minimal REST surface consumed by the Next shell. CORS allows the local dev origin;
 * in production this should match whatever host(s) actually serve the frontend.
 */
@RestController
@RequestMapping("/api/devices")
@CrossOrigin(origins = {"http://localhost:3000"})
public class DeviceController {

    private final DeviceStore store;

    public DeviceController(DeviceStore store) {
        this.store = store;
    }

    @GetMapping
    public List<DeviceStore.DeviceView> list() {
        return store.list();
    }
}
