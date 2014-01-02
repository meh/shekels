class Person < Lissio::Model
	adapter Lissio::Adapter::Storage

	property :name, as: String, primary: true

	def debts
		Payments.fetch(name: name, sign: :-)
	end

	def credits
		Payments.fetch(name: name, sign: :+)
	end
end
