import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;

public class TestAdvapi {
    public static void main(String[] args) {
        String path = "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";
        String[] keys = Advapi32Util.registryGetKeys(WinReg.HKEY_LOCAL_MACHINE, path);
        System.out.println("Found " + keys.length + " keys in HKLM.");
    }
}
