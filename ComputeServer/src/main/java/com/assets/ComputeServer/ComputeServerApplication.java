package com.assets.ComputeServer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ComputeServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ComputeServerApplication.class, args);
	}

}
