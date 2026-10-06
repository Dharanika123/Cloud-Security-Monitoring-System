import java.util.List;
import oshi.SystemInfo;
import oshi.hardware.UsbDevice;

public class TestOshi {
    public static void main(String[] args) {
        SystemInfo si = new SystemInfo();
        List<UsbDevice> usbs = si.getHardware().getUsbDevices(false);
        for(UsbDevice u : usbs) {
            System.out.println(u.getName() + " | " + u.getVendorId() + " | " + u.getProductId() + " | " + u.getSerialNumber() + " | " + u.getUniqueDeviceId());
        }
    }
}
